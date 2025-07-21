import os
from unittest.mock import patch

from db_utils.core import execute_statements, ResultType
from importer.import_crosses import import_crosses


@patch('importer.import_crosses.complete_job')
def test_import_2025_crosses(mock_complete_job, set_cleanup_sql_fn):

    set_cleanup_sql_fn('DELETE FROM requested_cross WHERE extract(YEAR FROM cross_date) = 2025')
    set_cleanup_sql_fn('DELETE FROM family WHERE extract(YEAR FROM cross_date) = 2025')

    import_crosses(os.path.join(os.path.dirname(__file__), 'resources', '2025_all_refuge_crosses.csv'),
                   'amphiadmin', 'fake_job_id', 2025)

    mock_complete_job.assert_called_once()

    assert execute_statements(["SELECT count(*) FROM supplementation_family"],
                              'amphiadmin', ResultType.RowResults).get_single_result() == 0, \
        "Additional cleanup must be done manually supplementation_family table should be empty"
    assert execute_statements(["SELECT count(*) FROM family WHERE extract(YEAR FROM cross_date) = 2025"],
                              'amphiadmin', ResultType.RowResults).get_single_result() == 315
    assert execute_statements(["SELECT count(*) FROM requested_cross WHERE extract(YEAR FROM cross_date) = 2025"],
                              'amphiadmin', ResultType.RowResults).get_single_result() == 315
