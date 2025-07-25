from enum import Enum

import sqlalchemy

from amphi_logging.logger import get_logger
from db_utils.db_connection import get_connection, make_connection_kwargs, get_default_database_params

LOGGER = get_logger('db_utils')


class ResultType(Enum):
    NoResult = 0
    RowResults = 1
    RowCount = 2


class ExecuteSqlResult:

    def __init__(self):
        self.tx_id: str = ""
        self.row_results = []
        self.row_cnts = []
        self.cols = []

    def get_row(self, row_idx: int):
        try:
            return self.row_results[row_idx]
        except IndexError:
            return None

    def get_col_in_row(self, row_idx: int, col_idx: int):
        return self.row_results[row_idx][col_idx]

    def get_single_result(self):
        try:
            return self.row_results[0][0]
        except IndexError:
            return None

    def get_total_row_cnt(self) -> int:
        total_rows = 0
        for row_cnt in self.row_cnts:
            total_rows = total_rows + row_cnt

        return total_rows

    def get_as_list_of_dicts(self) -> list:
        def to_dict_result(vals):
            dict_result = {}
            for col_idx, c in enumerate(self.cols):
                dict_result[c] = vals[col_idx]
            return dict_result
        return list(map(to_dict_result, self.row_results))


def execute_statements(stmt_param_tuples, username: str,
                       result_type: ResultType = ResultType.RowResults, abort: bool = False,
                       log_statement: bool = True):
    """

    :param stmt_param_tuples: stmts and param tuples, or just statements, if there are no params
    :param username: amphi_user username to execute the queries as
    :param result_type: What type of results caller is expecting
    Dict of table_name: [cols]
    :param abort: don't actually issues statement (used for debugging only)
    :param log_statement: Logs the query that is being executed
    :return: Results of query with type specified by caller
    """
    if not isinstance(stmt_param_tuples, list):
        stmt_param_tuples = [stmt_param_tuples]

    results = ExecuteSqlResult()
    with get_connection(**make_connection_kwargs(get_default_database_params(), username, abort=abort)) as conn:
        if abort:
            return
        for maybe_stmt_tuple in stmt_param_tuples:
            stmt, params = (maybe_stmt_tuple[0], maybe_stmt_tuple[1]) \
                if isinstance(maybe_stmt_tuple, tuple) else (maybe_stmt_tuple, {})
            try:
                if log_statement:
                    LOGGER.info(f"Executing: {stmt[0:50]} with params: {params}")
                result = conn.execute(sqlalchemy.text(stmt), params)
            except Exception as e:
                LOGGER.exception(f"Exception while executing statement: {stmt} with params {params}")
                raise e

            if result_type == ResultType.RowResults:
                results.row_results.extend(result.fetchall())
                results.cols = result.keys()
            elif result_type == ResultType.RowCount:
                results.row_cnts.append(result.rowcount)

    return results


def get_as_list_of_dicts(row_results) -> list:
    return list(map(dict, row_results))
