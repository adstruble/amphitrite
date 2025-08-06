import os
from datetime import date
from unittest.mock import patch, call, ANY

import pytest

from db_utils.core import execute_statements, ResultType
from importer.import_crosses import import_crosses
from utils.server_state import JobState


@pytest.fixture
def set_cleanup_sqls(set_cleanup_sql_fn):
    set_cleanup_sql_fn('DELETE FROM supplementation_family_note sfn WHERE EXISTS('
                       'SELECT 1 FROM supplementation_family '
                       'WHERE id = sfn.family AND extract(YEAR FROM cross_date) = 2025)')
    set_cleanup_sql_fn('DELETE FROM family_note fn WHERE EXISTS('
                       'SELECT 1 FROM family '
                       'WHERE id = fn.family AND extract(YEAR FROM cross_date) = 2025)')
    set_cleanup_sql_fn('DELETE FROM requested_cross WHERE extract(YEAR FROM cross_date) = 2025')
    set_cleanup_sql_fn('DELETE FROM public.supplementation_family WHERE extract(YEAR FROM cross_date) = 2025')
    set_cleanup_sql_fn('DELETE FROM family WHERE extract(YEAR FROM cross_date) = 2025')


@patch('importer.import_crosses.complete_job')
def test_import_2025_crosses(mock_complete_job, set_cleanup_sqls):

    import_crosses(os.path.join(os.path.dirname(__file__),
                                'resources', 'completed_crosses', '2025_all_refuge_crosses.csv'),
                   'amphiadmin', 'fake_job_id', 2025)

    mock_complete_job.assert_called_once()
    assert mock_complete_job.call_args_list == [call(ANY, JobState.Complete.name, ANY)]

    assert execute_statements(["SELECT count(*) FROM supplementation_family"],
                              'amphiadmin', ResultType.RowResults).get_single_result() == 0, \
        "Additional cleanup must be done manually supplementation_family table should be empty"
    assert execute_statements(["SELECT count(*) FROM family WHERE extract(YEAR FROM cross_date) = 2025"],
                              'amphiadmin', ResultType.RowResults).get_single_result() == 315
    assert execute_statements(["SELECT count(*) FROM requested_cross WHERE extract(YEAR FROM cross_date) = 2025"],
                              'amphiadmin', ResultType.RowResults).get_single_result() == 315


@patch('importer.import_crosses.complete_job')
def test_import_supplementation_crosses(mock_complete_job, set_cleanup_sqls):

    import_crosses(os.path.join(os.path.dirname(__file__),
                                'resources', 'completed_crosses',  'supplementation_crosses.csv'),
                   'amphiadmin', 'fake_job_id2', 2025)

    mock_complete_job.assert_called_once()
    assert mock_complete_job.call_args_list == [call(ANY, JobState.Complete.name, ANY)]

    families = get_families('supplementation_family', 'supplementation_family_note')

    assert families[0] == {'content': 'Supplementation one', 'mfg': 5, 'f_tag': 'YP00',
                           'm_tag': 'YN22', 'cross_date': date.fromisoformat('2025-02-28'), 'group_id': 1}
    assert families[1] == {'content': 'Supplementation two', 'mfg': 5, 'f_tag': 'YN80',
                           'm_tag': 'YN04', 'cross_date': date.fromisoformat('2025-04-14'), 'group_id': 2} # noqa
    assert families[2] == {'content': 'Supplementation three', 'mfg': 6, 'f_tag': 'YO60',
                           'm_tag': 'YO58', 'cross_date': date.fromisoformat('2025-06-28'), 'group_id': 30} # noqa

    assert execute_statements(["SELECT count(*) FROM family WHERE extract(YEAR FROM cross_date) = 2025"],
                              'amphiadmin', ResultType.RowResults).get_single_result() == 0
    assert execute_statements(["SELECT count(*) FROM requested_cross WHERE extract(YEAR FROM cross_date) = 2025"],
                              'amphiadmin', ResultType.RowResults).get_single_result() == 3


@patch('importer.import_crosses.complete_job')
def test_import_supplementation_and_refuge_crosses(mock_complete_job, set_cleanup_sqls):

    import_crosses(os.path.join(os.path.dirname(__file__),
                                'resources', 'completed_crosses', 'supplementation_and_refuge_crosses.csv'),
                   'amphiadmin', 'fake_job_id2', 2025)

    mock_complete_job.assert_called_once()
    assert mock_complete_job.call_args_list == [call(ANY, JobState.Complete.name, ANY)]

    families = get_families('supplementation_family', 'supplementation_family_note')
    assert families == get_expected_supplementation_families()

    families = get_families('family', 'family_note')
    assert families == get_expected_refuge_families()

    assert execute_statements([
        "SELECT count(*) FROM requested_cross WHERE extract(YEAR FROM cross_date) = 2025"],
        'amphiadmin', ResultType.RowResults).get_single_result() == 6


def get_expected_supplementation_families():
    return [{'content': 'Supplementation one', 'mfg': 5, 'f_tag': 'YP00',
            'm_tag': 'YN22', 'cross_date': date.fromisoformat('2025-02-28'), 'group_id': 1},
            {'content': '', 'mfg': 5, 'f_tag': 'YN80', 'm_tag': 'YN04', 'cross_date': date.fromisoformat('2025-04-14'),
             'group_id': 2},
            {'content': 'Supplementation three', 'mfg': 6, 'f_tag': 'YO60',
             'm_tag': 'YO58', 'cross_date': date.fromisoformat('2025-06-28'), 'group_id': 30}]


def get_expected_refuge_families():
    return[{'content': 'refuge1', 'mfg': 2, 'f_tag': 'RM04',
            'm_tag': 'RJ07', 'cross_date': date.fromisoformat('2025-01-31'), 'group_id': 15},
           {'content': '', 'mfg': 2, 'f_tag': 'RC15',
            'm_tag': 'YJ17', 'cross_date': date.fromisoformat('2025-02-04'), 'group_id': 16},
           {'content': 'Refuge no mfg', 'mfg': None, 'f_tag': 'RV44',
            'm_tag': 'RF57', 'cross_date': date.fromisoformat('2025-05-20'), 'group_id': 347}]


@patch('importer.import_crosses.complete_job')
def test_import_crosses_note_change(mock_complete_job, set_cleanup_sqls):

    import_crosses(os.path.join(os.path.dirname(__file__),
                                'resources', 'completed_crosses','supplementation_and_refuge_crosses.csv'),
                   'amphiadmin', 'fake_job_id2', 2025)

    mock_complete_job.assert_called_once()

    import_crosses(os.path.join(os.path.dirname(__file__),
                                'resources', 'completed_crosses', 'supplementation_and_refuge_crosses_note_change.csv'),
                   'amphiadmin', 'fake_job_id2', 2025)

    assert mock_complete_job.call_count == 2
    assert mock_complete_job.call_args_list == [call(ANY, JobState.Complete.name, ANY),
                                                call(ANY, JobState.Complete.name, ANY)]

    families = get_families('supplementation_family', 'supplementation_family_note')
    expected_families = get_expected_supplementation_families()
    expected_families[0]['content'] = 'Supplementation one note change suppl1'
    assert families == expected_families

    families = get_families('family', 'family_note')
    assert families == get_expected_refuge_families()

    assert execute_statements([
        "SELECT count(*) FROM requested_cross WHERE extract(YEAR FROM cross_date) = 2025"],
        'amphiadmin', ResultType.RowResults).get_single_result() == 6


def get_families(table, note_table):
    return execute_statements([f"""
SELECT n.content, f.mfg, mom_tag.tag f_tag, dad_tag.tag m_tag, f.cross_date, f.group_id
    FROM {table} f
    JOIN {note_table} n ON n.family = f.id
    JOIN refuge_tag mom_tag on mom_tag.animal = f.parent_1
    JOIN refuge_tag dad_tag ON dad_tag.animal = f.parent_2
    WHERE 2025 = extract(YEAR from f.cross_date)
    ORDER BY cross_date"""], 'amphiadmin', ResultType.RowResults).get_as_list_of_dicts()
