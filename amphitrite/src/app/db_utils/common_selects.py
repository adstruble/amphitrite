def get_version(conn):

    version = conn.execute('SELECT major, minor, patch '
                           '  FROM amphitrite.version ORDER BY major, minor, patch DESC LIMIT 1').fetchone()
    return version
