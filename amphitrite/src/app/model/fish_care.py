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


def get_fish_care(username: str) -> list:
    """All fish care rows, newest observation first. Dates cast to text for a stable JSON shape
    ('YYYY-MM-DD') the frontend can consume directly."""
    return execute_statements(
        'SELECT facility, system, sheet_year, obs_date::text AS obs_date, tank_id, carer, temp, '
        'dissolved_oxygen, salinity, ph, turbidity, ammonia, nitrite, nitrate, morts, notes, '
        'source, synced_at::text AS synced_at '
        'FROM fish_care '
        'ORDER BY obs_date DESC NULLS LAST, facility, system NULLS FIRST, tank_id',
        username).get_as_list_of_dicts()


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
