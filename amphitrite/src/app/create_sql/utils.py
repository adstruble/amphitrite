import os

from sqlalchemy import text

from amphi_logging.logger import get_logger
from db_utils import db_connection
from db_utils.db_connection import AMPHIADMIN_DB_PARAMS, PGConnections

LOGGER = get_logger('create_sql.utils')


def get_version_from_migration_filename(filename):
    version = filename.split('V')[1].split('.')[:-1]
    return {'major': int(version[0]), 'minor': int(version[1]), 'patch': int(version[2])}


def apply_sql_migration(sql_filename):

    engine = PGConnections().get_engine(AMPHIADMIN_DB_PARAMS)
    with engine.connect() as conn:
        with open(sql_filename) as file:
            query = text(file.read())
            conn.execute(query)
    with engine.connect() as conn:
        cnt = conn.execute("Select count(*) from amphitrite.version").fetchone()
        LOGGER.info(f"{cnt} amphitrite datastore versions")
