from enum import Enum

from amphi_logging.logger import get_logger
from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS, AMPHIADMIN_DB_PARAMS

LOGGER = get_logger('db_utils')


class ResultType(Enum):
    NoResult = 0
    SingleResult = 1
    All = 2


def execute_statements(stmt_param_tuples, username: str,
                       result_type: ResultType = ResultType.SingleResult):
    """

    :param stmt_param_tuples: stmts and param tuples, or just statements, if there are no params
    :param username: amphi_user username to execute the queries as
    :param result_type: What type of results caller is expecting
    Dict of table_name: [cols]
    :return: Results of query with type specified by caller
    """
    if not isinstance(stmt_param_tuples, list):
        stmt_param_tuples = [stmt_param_tuples]

    results = []

    with get_connection(DEFAULT_DB_PARAMS, username) as conn:
        for maybe_stmt_tuple in stmt_param_tuples:
            stmt, params = (maybe_stmt_tuple[0], maybe_stmt_tuple[1]) \
                if isinstance(maybe_stmt_tuple, tuple) else (maybe_stmt_tuple, {})
            try:
                if isinstance(stmt, str):
                    result = conn.exec_driver_sql(stmt, params)
                else:
                    result = conn.execute(stmt, params)
            except Exception as e:
                LOGGER.exception(f"Exception while executing statement: {stmt} with params {params}", e)
                raise e

            if result_type == ResultType.NoResult:
                continue

            if result_type == ResultType.SingleResult:
                return result.fetchone()[0]

            results.extend(result.fetchall())

    return results
