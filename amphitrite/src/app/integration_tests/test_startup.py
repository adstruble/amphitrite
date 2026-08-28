from unittest.mock import patch

from db_utils.core import execute_statements, ResultType

from configs.gunicorn_conf_common import on_starting


def _element_count():
    return execute_statements(["SELECT count(*) FROM element"],
                              'amphiadmin', ResultType.RowResults).get_single_result()


@patch('importer.import_master.complete_job')
@patch('utils.server_state.get_client_manager')
def test_on_startup_already_seeded(mock_get_client_manager, _):
    # On an already-seeded DB, startup must NOT re-seed. Asserting the element count is unchanged
    # tests that intent directly and is robust to seed-data size and test ordering (unlike a
    # hardcoded absolute count).
    before = _element_count()

    on_starting(None) # noqa

    mock_get_client_manager.assert_called_once()
    assert _element_count() == before
