from sqlalchemy import text, Connection
from psycopg2.errors import  UndefinedTable
from sqlalchemy.exc import ProgrammingError


def get_version(conn: Connection):
    try:
        version = conn.execute(text('SELECT major, minor, patch '
                               '  FROM version ORDER BY major, minor, patch DESC LIMIT 1')).fetchone()
        return {'major': version[0], 'minor': version[1], 'patch': version[2]}
    except ProgrammingError as e:
        if isinstance(e.orig, UndefinedTable):
            return {'major': 0, 'minor': 0, 'patch': 0}
        else:
            raise e