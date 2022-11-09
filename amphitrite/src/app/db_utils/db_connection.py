import sqlalchemy

DEFAULT_DB_PARAMS = {"host": "datastore.datastore", "database": "amphitrite"}

AMPHIADMIN_DB_PARAMS = DEFAULT_DB_PARAMS | {'user': 'amphiadmin', 'password': 'amphiadmin'}


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

        return self._engines[conn_string]


def get_engine_user_postgres():
    return PGConnections().get_engine({'database': 'postgres',
                                       'user': 'postgres',
                                       'host': 'datastore.datastore',
                                       'password': 'postgres'})
