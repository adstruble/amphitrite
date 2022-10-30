import os

from sqlalchemy import text

from db_utils import db_connection
from db_utils.db_connection import get_engine_user_postgres


def get_version_from_migration_filename(filename):
    return filename.split('V')[1].split('.')[:-1]


def apply_sql_migration(sql_filename):

    engine = get_engine_user_postgres()
    with engine.connect() as conn:
        with open(sql_filename) as file:
            query = text(file.read())
            conn.execute(query)
