from unittest.mock import patch

from db_utils.core import execute_statements, ResultType

from configs.gunicorn_conf_common import on_starting


@patch('importer.import_master.complete_job')
@patch('utils.server_state.get_client_manager')
def test_on_startup_already_seeded(mock_complete_job, _):
    on_starting(None) # noqa

    element_cnt = execute_statements(["SELECT count(*) FROM element"],
                                     'amphiadmin', ResultType.RowResults).get_single_result()

    mock_complete_job.assert_called_once()
    assert element_cnt == 266568