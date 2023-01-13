from enum import Enum

from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS


class ResultType(Enum):
    NoResult = 0
    SingleResult = 1


def execute_statement(stmt, result_type: ResultType = ResultType.SingleResult, params=None):
    with get_connection(DEFAULT_DB_PARAMS) as conn:
        result = conn.execute(stmt, params)
        if result_type == ResultType.NoResult:
            return

        if result_type == ResultType.SingleResult:
            return result.fetchone()
