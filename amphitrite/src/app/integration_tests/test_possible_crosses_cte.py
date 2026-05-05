"""
Tests that the CTE-based get_possible_crosses implementation produces results
identical to the original correlated-subquery implementation.

Test data (BY2025 fish, 2026 breeding season):
  FSG 13 females: YB34_1, YB71_1, YB78_1
  FSG 13 males:   YB18_2, YB47_2, YB46_2
  FSG 69 females: YI03_1, YI20_1, YO70_1
  FSG 69 males:   YI14_2, YI46_2, YO86_2

Key test cross (in resources/completed_crosses/2026_test_refuge_cross.csv):
  YI14_2 (M, FSG 69) x YB34_1 (F, FSG 13)
  -> family table: parent_2=YI14_2 (FSG 69), parent_1=YB34_1 (FSG 13)

Scenarios tested:
  1. Baseline: no prior crosses -> both implementations return same result set.
  2. Standard orientation: female from the previously-crossed family is available
     -> both return the cross with completed_x populated.
  3. Reversed orientation: a MALE sibling from the female family was the one previously
     crossed -> both implementations exclude the row identically (the sibling's tag is
     not in f_tags so the filter removes it in both cases).
"""

import os
from unittest.mock import patch

import pytest

from amphitrite import app as AmphitriteServer
from db_utils.core import execute_statements, ResultType
from importer.import_master import import_master_data
from importer.import_crosses import import_crosses
from model.crosses import set_available_fish, get_possible_crosses, get_num_fam_crosses_completed_or_requested

RESOURCES_DIR = os.path.join(os.path.dirname(__file__), 'resources')
MASTER_DIR = os.path.join(RESOURCES_DIR, 'master_sheets')
CROSSES_DIR = os.path.join(RESOURCES_DIR, 'completed_crosses')
REFUGE_CROSS_FILE = os.path.join(CROSSES_DIR, '2026_test_refuge_cross.csv')

USERNAME = 'amphiadmin'

DEFAULT_QUERY_PARAMS = {
    'offset': 0,
    'limit': 500,
    'order_by': [],
    'return_size': True,
    'like_filter': '',
    'exact_filters': {},
}


# ---------------------------------------------------------------------------
# Reference implementation (original correlated-subquery approach)
# ---------------------------------------------------------------------------

def _get_tag_crossed_ref(male: bool) -> str:
    return f"""SELECT concat(tag, '_ref') FROM family ngf
            JOIN animal m on ngf.parent_2 = m.id and (m.family = pc.male or m.family = xf.id)
            JOIN animal f ON ngf.parent_1 = f.id and (f.family = xf.id or f.family = pc.male)
            JOIN refuge_tag rt ON rt.animal = {"m.id" if male else "f.id"}
            WHERE NOT ngf.cross_failed
            UNION
            SELECT concat(rt.tag, '_sup') FROM public.supplementation_family ngf
            JOIN animal m on ngf.parent_2 = m.id and m.family = pc.male
            JOIN animal f ON ngf.parent_1 = f.id and f.family = xf.id
            JOIN refuge_tag rt ON rt.animal = {"m.id" if male else "f.id"}
            WHERE NOT ngf.cross_failed
            LIMIT 1"""


def _get_possible_crosses_reference(username, query_params):
    """Identical logic to the pre-CTE get_possible_crosses."""
    from model.crosses import _get_order_by_clause_for_possible_crosses

    filter_str = ""
    if query_params.get('like_filter'):
        like_filter = "LIKE :like_filter || '%'"
        filter_str = (f" AND (rty.tag {like_filter} OR rtx.tag {like_filter} OR "
                      f"xf.group_id::text {like_filter} OR yf.group_id::text {like_filter})")

    exact_filter = query_params.get('exact_filters', {})
    exact_filters = []
    for idx, (key, value) in enumerate(exact_filter.items()):
        if key in ('f_tag', 'm_tag'):
            exact_filters.append(f":ef_{idx} = ANY({key}s)")
        else:
            exact_filters.append(f"{key} = :ef_{idx}")
        query_params[f"ef_{idx}"] = value
    if exact_filters:
        filter_str = f" {filter_str} AND ({' AND '.join(exact_filters)})"

    ref_y = get_num_fam_crosses_completed_or_requested('pc.male', False)
    ref_x = get_num_fam_crosses_completed_or_requested('xf.id', False)
    sup_y = get_num_fam_crosses_completed_or_requested('pc.male', True)
    sup_x = get_num_fam_crosses_completed_or_requested('xf.id', True)

    columns_sql = f"""SELECT * FROM (
        SELECT concat(xf.id,'__', pc.male) as id,
            xf.id p1_fam_id,
            pc.male p2_fam_id,
            xf.group_id x_gid,
            yf.group_id y_gid,
            array_agg(distinct rtx.tag) f_tags,
            array_agg(distinct rty.tag) m_tags,
            {ref_x} x_crosses,
            {ref_y} AS y_crosses,
            {sup_x} sup_x_crosses,
            {sup_y} AS sup_y_crosses,
            requested_cross.id is not null AND NOT requested_cross.supplementation as refuge,
            requested_cross.id is not null AND requested_cross.supplementation as supplementation,
            pc.f,
            pc.di,
            (SELECT CASE WHEN pc.male = ANY(select distinct f.family from possible_cross pc join animal f on pc.female = f.id)
                         THEN 1 ELSE 0 END
                         + count(*) FROM requested_cross WHERE parent_m_fam = pc.male AND parent_f_fam != xf.id AND cross_date is null)
                         AS selected_male_fam_cnt,
            xf.cross_year as x_cross_year,
            yf.cross_year as y_cross_year,
            ({_get_tag_crossed_ref(True)}) as completed_y,
            ({_get_tag_crossed_ref(False)}) as completed_x
            """
    records_sql = f"""FROM possible_cross as pc
                    JOIN animal as x ON pc.female = x.id
                    JOIN family as xf ON x.family = xf.id
                    LEFT JOIN requested_cross ON xf.id = requested_cross.parent_f_fam AND pc.male = requested_cross.parent_m_fam
                    JOIN animal as y ON y.family = pc.male AND (NOT y.id = ANY(
                             SELECT parent_m FROM requested_cross rc_completed WHERE rc_completed.parent_m is not null AND NOT rc_completed.supplementation
                             )
                         OR requested_cross.parent_m = y.id)
                         AND y.id IN (SELECT animal from available_animal)
                    JOIN family as yf on yf.id = pc.male
                    JOIN refuge_tag rtx ON rtx.animal = x.id
                LEFT JOIN refuge_tag rty ON rty.animal = y.id
                         AND NOT rty.animal = ANY( SELECT parent_m FROM requested_cross rc_completed
                        WHERE rc_completed.parent_m is not null AND (NOT rc_completed.supplementation or requested_cross.supplementation)
                            AND NOT (rc_completed.parent_m = requested_cross.parent_m and rc_completed.id = requested_cross.id))
                   WHERE x.sex = 'F' AND y.sex = 'M' AND x.alive AND y.alive {filter_str}
                GROUP BY xf.group_id, yf.group_id, pc.male, xf.id, xf.cross_year, yf.cross_year, requested_cross.id, requested_cross.supplementation, pc.f, pc.di"""

    order_sql = f""" {_get_order_by_clause_for_possible_crosses(query_params['order_by'], ref_y, ref_x, sup_y, sup_x)}
                 )q WHERE (completed_x IS NULL OR substr(completed_x, 1, length(completed_x)-4) = ANY(f_tags)) OFFSET :offset LIMIT :limit"""

    rows = execute_statements((columns_sql + records_sql + order_sql, query_params),
                              username).get_as_list_of_dicts()

    if not query_params.get('return_size', True):
        return rows, None

    cnt_sql = (f"SELECT count(*) FROM (SELECT ({_get_tag_crossed_ref(False)}) as completed_x,"
               f" array_agg(distinct rtx.tag) f_tags ")
    cnt_end = ")q WHERE (completed_x IS NULL OR substr(completed_x,1, length(completed_x)-4) = ANY (f_tags))"
    cnt = execute_statements((cnt_sql + records_sql + cnt_end, query_params),
                             username).get_single_result()

    return rows, cnt


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_ids(rows):
    return {r['id'] for r in rows}


def _completed_x_by_id(rows):
    return {r['id']: r['completed_x'] for r in rows}


def _completed_y_by_id(rows):
    return {r['id']: r['completed_y'] for r in rows}


def _clean_possible_and_available():
    execute_statements(
        ['DELETE FROM possible_cross', 'DELETE FROM available_animal'],
        USERNAME, ResultType.NoResult)


def _run_both(query_params=None):
    params_cte = {**DEFAULT_QUERY_PARAMS, **(query_params or {})}
    params_ref = {**DEFAULT_QUERY_PARAMS, **(query_params or {})}
    cte_rows, cte_cnt = get_possible_crosses(USERNAME, params_cte)
    ref_rows, ref_cnt = _get_possible_crosses_reference(USERNAME, params_ref)
    return cte_rows, cte_cnt, ref_rows, ref_cnt


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope='module')
def client():
    AmphitriteServer.config['TESTING'] = True
    with AmphitriteServer.test_client() as c:
        yield c


@pytest.fixture(scope='module')
def load_2026_master():
    with patch('importer.import_master.complete_job'):
        import_master_data(MASTER_DIR, USERNAME, '2026_master_test.csv', 2026, False)
    yield
    execute_statements(
        ['DELETE FROM possible_cross',
         'DELETE FROM available_animal',
         'DELETE FROM supplementation_family_note sfn WHERE EXISTS(SELECT 1 FROM supplementation_family sf WHERE sf.id = sfn.family AND extract(YEAR FROM sf.cross_date) = 2026)',
         'DELETE FROM supplementation_family WHERE extract(YEAR FROM cross_date) = 2026',
         'DELETE FROM family WHERE extract(YEAR FROM cross_date) = 2026',
         'DELETE FROM gene WHERE animal IN (SELECT animal FROM refuge_tag WHERE year = 2026)',
         'DELETE FROM animal_note WHERE animal IN (SELECT animal FROM refuge_tag WHERE year = 2026)',
         'DELETE FROM requested_cross WHERE parent_f IN (SELECT animal FROM refuge_tag WHERE year = 2026) OR parent_m IN (SELECT animal FROM refuge_tag WHERE year = 2026)',
         'DELETE FROM pedigree WHERE child IN (SELECT animal FROM refuge_tag WHERE year = 2026) OR parent IN (SELECT animal FROM refuge_tag WHERE year = 2026)',
         'DELETE FROM animal WHERE id IN (SELECT animal FROM refuge_tag WHERE year = 2026)',
         'DELETE FROM refuge_tag WHERE year = 2026'],
        USERNAME, ResultType.NoResult)


@pytest.fixture(scope='module')
def import_test_refuge_cross(load_2026_master):
    with patch('importer.import_crosses.complete_job'):
        import_crosses(REFUGE_CROSS_FILE, USERNAME, 'test_job_cte', 2026)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_baseline_no_prior_crosses(load_2026_master, set_cleanup_sql_fn):
    """With no completed crosses both implementations return identical results."""
    set_cleanup_sql_fn('DELETE FROM possible_cross')
    set_cleanup_sql_fn('DELETE FROM available_animal')

    # FSG 9: YB39 (M), YB31 (F) — no prior crossing of these families
    set_available_fish(USERNAME, ['YB31', 'YA43'])

    cte_rows, cte_cnt, ref_rows, ref_cnt = _run_both()

    assert _row_ids(cte_rows) == _row_ids(ref_rows), "Row IDs differ in baseline test"
    assert cte_cnt == ref_cnt, "Counts differ in baseline test"
    for row_id in _row_ids(cte_rows):
        assert _completed_x_by_id(cte_rows)[row_id] == _completed_x_by_id(ref_rows)[row_id]
        assert _completed_y_by_id(cte_rows)[row_id] == _completed_y_by_id(ref_rows)[row_id]

    _clean_possible_and_available()


def test_standard_orientation_prior_cross(import_test_refuge_cross, set_cleanup_sql_fn):
    """
    Standard orientation: YB34_1 (F, FSG 13) was previously crossed with YI14_2 (M, FSG 69).
    When YB34_1 is available again, both implementations should show the cross with
    completed_x = 'YB34_1_ref'.
    """
    set_cleanup_sql_fn('DELETE FROM possible_cross')
    set_cleanup_sql_fn('DELETE FROM available_animal')

    # YB34 (F, FSG 13) + YI46 (M, FSG 69 — different male from same family as YI14)
    set_available_fish(USERNAME, ['YB34', 'YI46'])

    cte_rows, cte_cnt, ref_rows, ref_cnt = _run_both()

    assert _row_ids(cte_rows) == _row_ids(ref_rows), "Row IDs differ in standard orientation test"
    assert cte_cnt == ref_cnt

    # There should be exactly one possible cross: FSG 13 x FSG 69
    assert len(cte_rows) == 1
    row_id = list(_row_ids(cte_rows))[0]
    cte_cx = _completed_x_by_id(cte_rows)[row_id]
    ref_cx = _completed_x_by_id(ref_rows)[row_id]

    # Both should show YB34 as the previously-crossed female
    assert cte_cx == ref_cx, f"completed_x differs: CTE={cte_cx!r} ref={ref_cx!r}"
    assert cte_cx is not None and 'YB34' in cte_cx

    _clean_possible_and_available()


def test_reversed_orientation_prior_cross(import_test_refuge_cross, set_cleanup_sql_fn):
    """
    Reversed orientation: YI14_2 (M, FSG 69) was used as the male in a cross with
    YB34_1 (F, FSG 13).  When a *different* female from FSG 69 (YI03_1) is available
    along with a male from FSG 13 (YB18_2), both implementations should produce the
    same result set — the sibling-male's tag is not in f_tags so both filter the row
    out identically, meaning the cross is not shown as previously completed.
    """
    set_cleanup_sql_fn('DELETE FROM possible_cross')
    set_cleanup_sql_fn('DELETE FROM available_animal')

    # YI03 (F, FSG 69) + YB18 (M, FSG 13)
    set_available_fish(USERNAME, ['YI03', 'YB18'])

    cte_rows, cte_cnt, ref_rows, ref_cnt = _run_both()

    assert _row_ids(cte_rows) == _row_ids(ref_rows), (
        f"Row IDs differ in reversed orientation test: "
        f"CTE={_row_ids(cte_rows)}, ref={_row_ids(ref_rows)}")
    assert cte_cnt == ref_cnt

    for row_id in _row_ids(cte_rows):
        assert _completed_x_by_id(cte_rows)[row_id] == _completed_x_by_id(ref_rows)[row_id]
        assert _completed_y_by_id(cte_rows)[row_id] == _completed_y_by_id(ref_rows)[row_id]

    _clean_possible_and_available()
