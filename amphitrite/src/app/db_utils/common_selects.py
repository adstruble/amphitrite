from sqlalchemy import text


def get_version(conn):

    version = conn.execute(text('SELECT major, minor, patch '
                           '  FROM version ORDER BY major, minor, patch DESC LIMIT 1')).fetchone()
    return version
