import uuid
from datetime import datetime

from amphi_logging.logger import get_logger
from db_utils.core import execute_statements
from db_utils.db_connection import get_connection, get_default_database_params, make_connection_kwargs
from db_utils.insert import insert_table_data

LOGGER = get_logger('model')

# Canonical fish_care data columns (excludes the inherited element columns: id, created_at, last_modified).
FISH_CARE_COLUMNS = [
    'facility', 'system', 'sheet_year', 'obs_date', 'tank_id', 'carer', 'temp',
    'dissolved_oxygen', 'salinity', 'ph', 'turbidity', 'ammonia', 'nitrite', 'nitrate',
    'morts', 'notes', 'source', 'synced_at',
]

# COPY (used by insert_table_data) reads this sentinel as SQL NULL — see db_utils/insert.py.
_NULL = '\\N'


_SELECT_COLS = (
    'id::text AS id, facility, system, sheet_year, obs_date::text AS obs_date, tank_id, carer, temp, '
    'dissolved_oxygen, salinity, ph, turbidity, ammonia, nitrite, nitrate, morts, notes, '
    'source, synced_at::text AS synced_at'
)


def _build_fish_care_filter(query_params: dict) -> tuple:
    """Build the WHERE clause + params from AmphiTable's like_filter (free-text search) and
    exact_filters (facility, date range, min morts)."""
    clauses, params = [], {}

    like = query_params.get('like_filter')
    if like:
        params['like_filter'] = f"%{like}%"
        clauses.append("(facility ILIKE :like_filter OR system ILIKE :like_filter "
                       "OR tank_id ILIKE :like_filter OR carer ILIKE :like_filter "
                       "OR notes ILIKE :like_filter OR obs_date::text ILIKE :like_filter)")

    exact = query_params.get('exact_filters') or {}
    if exact.get('facility'):
        params['facility'] = exact['facility']
        clauses.append("facility = :facility")
    if exact.get('date_from'):
        params['date_from'] = exact['date_from']
        clauses.append("obs_date >= :date_from")
    if exact.get('date_to'):
        params['date_to'] = exact['date_to']
        clauses.append("obs_date <= :date_to")
    min_morts = exact.get('min_morts')
    if min_morts not in (None, ''):
        try:
            params['min_morts'] = int(min_morts)
            clauses.append("morts >= :min_morts")
        except (ValueError, TypeError):
            pass

    return (("WHERE " + " AND ".join(clauses)) if clauses else ""), params


def get_fish_care(username: str, query_params: dict, order_by_clause: str, include_cnt: bool = True) -> tuple:
    """Paginated/sorted/filtered fish care rows for the AmphiTable view.

    :param query_params: expects offset, limit; optionally like_filter and exact_filters
    :param order_by_clause: validated 'ORDER BY ...' clause (see blueprint's validate_order_by)
    :return: (rows, total_count) — count is -1 when include_cnt is False
    """
    filter_str, filter_params = _build_fish_care_filter(query_params)
    rows = execute_statements((
        f"SELECT {_SELECT_COLS} FROM fish_care {filter_str} {order_by_clause} OFFSET :offset LIMIT :limit",
        {**filter_params, 'offset': query_params.get('offset', 0), 'limit': query_params.get('limit', 1000)}),
        username).get_as_list_of_dicts()

    count = -1
    if include_cnt:
        count = execute_statements((f"SELECT count(*) FROM fish_care {filter_str}", filter_params),
                                   username).get_single_result()
    return rows, count


def _to_db_row(row: dict, sheet: dict, source: str, synced_at: str) -> dict:
    """Build a full-column dict for one fish_care row, mapping None/'' to the COPY NULL sentinel."""
    def n(v):
        return _NULL if v is None or v == '' else v

    db_row = {
        'id': str(uuid.uuid4()),
        'facility': sheet['facility'],
        'system': n(sheet['system']),
        'sheet_year': sheet['sheet_year'],
        'source': source,
        'synced_at': synced_at,
    }
    for col in ('obs_date', 'tank_id', 'carer', 'temp', 'dissolved_oxygen', 'salinity', 'ph',
                'turbidity', 'ammonia', 'nitrite', 'nitrate', 'morts', 'notes'):
        db_row[col] = n(row.get(col))
    return db_row


def persist_sheets(parsed_sheets: list, username: str, source: str) -> dict:
    """Replace-per-sheet persistence: within one transaction, delete existing rows for each
    (facility, system, sheet_year) then bulk-insert that sheet's current rows. Re-importing the
    same workbook therefore yields no duplicates, and importing one sheet leaves the others intact.

    :param parsed_sheets: list of {facility, system, sheet_year, sheet_name, rows: [row dict]}
    :param source: 'xlsx' or 'gsheet'
    """
    synced_at = datetime.utcnow().isoformat(sep=' ', timespec='seconds')
    all_rows = []
    for sheet in parsed_sheets:
        for row in sheet['rows']:
            all_rows.append(_to_db_row(row, sheet, source, synced_at))

    inserted = 0
    with get_connection(**make_connection_kwargs(get_default_database_params(), username)) as conn:
        with conn.connection.cursor() as cursor:
            for sheet in parsed_sheets:
                cursor.execute(
                    'DELETE FROM fish_care WHERE facility = %s '
                    'AND system IS NOT DISTINCT FROM %s AND sheet_year = %s',
                    (sheet['facility'], sheet['system'], sheet['sheet_year']))
            if all_rows:
                inserted, _ = insert_table_data('fish_care', all_rows, cursor)

    return {"success": {"inserted": {"fish_care": inserted}}}
