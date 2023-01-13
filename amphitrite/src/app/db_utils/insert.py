from db_utils.core import execute_statement, ResultType
from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS


def insert_records(table, columns: list, values: list):
    """
    Inserts the given values as records in the given table.
    :param table: Table that the records should be inserted into
    :param columns: Names of columns that values are provided for
    :param values: List of dicts, where each dictionary contains values for each column
    """
    sql = f"""INSERT INTO {table} ({','.join(columns)})
                   VALUES (:{',:'.join(columns)})"""

    execute_statement(sql, ResultType.NoResult, values)

