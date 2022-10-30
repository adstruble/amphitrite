import sqlalchemy

DEFAULT_DB_PARAMS = {"host": "datastore.datastore", "database": "amphitrite"}


class PGConnections:
    # A singleton classes to make connections once and then fetch them
    __instance = None

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = object.__new__(cls)

        return cls.__instance

    def __init__(self):
        self._engines = {}

    def get_engine(self, database_params):
        conn_string = "postgresql://{}:{}@{}/{}".format(database_params['user'],
                                                        database_params['password'],
                                                        database_params['host'],
                                                        database_params['database'])
        if conn_string not in self._engines:
            self._engines[conn_string] = sqlalchemy.create_engine(conn_string)


def get_engine_user_postgres():
    pg_params = DEFAULT_DB_PARAMS
    pg_params['user'] = 'postgres'
    pg_params['password'] = 'postgres'
    return PGConnections().get_engine(pg_params)
