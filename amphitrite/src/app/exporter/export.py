import csv
import logging

import sqlalchemy

from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS
from utils.envionment import get_integer_env_variable

DEFAULT_EXPORT_BATCH_SIZE = 50000
EXPORT_BATCH_SIZE_ENV_VAR = 'EXPORT_BATCH_SIZE'


logger = logging.getLogger()


def get_export_batch_size():
    return get_integer_env_variable(EXPORT_BATCH_SIZE_ENV_VAR, DEFAULT_EXPORT_BATCH_SIZE)


def export_data_to_csv_file(query, columns, file_path, username):
    with open(file_path, "w+") as stream:
        export_data_as_csv(query, columns, stream, username)


def export_data_as_csv(query, columns, stream, username, batch_size=None):
    """
    Query the database and write CSV rows to an outputstream
    """

    logger.debug("writing {} to outputstream".format(query))
    record_count = 0

    batch_size = batch_size or get_export_batch_size()
    with get_connection(DEFAULT_DB_PARAMS, username) as conn:

        cur = conn.execute(sqlalchemy.text(query))

        stream.write(','.join(columns) + '\n')
        csv_writer = csv.writer(stream, quoting=csv.QUOTE_NONNUMERIC)

        while True:
            rows = cur.fetchmany(size=batch_size)
            if not rows:
                break

            csv_writer.writerows(rows)
            record_count += len(rows)

    return record_count
