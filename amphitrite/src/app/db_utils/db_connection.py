from contextlib import contextmanager

import sqlalchemy
from sqlalchemy import Engine
from sqlalchemy.engine import Connection

from amphi_logging.logger import get_logger

DEFAULT_DB_PARAMS = {"host": "datastore.datastore",
                     "database": "amphitrite",
                     'user': 'amphiuser',
                     'password': 'amphiuser'}

AMPHIADMIN_DB_PARAMS = DEFAULT_DB_PARAMS | {'user': 'amphiadmin', 'password': 'amphiadmin'}
SET_SESSION_TEMPLATE: str = "SET SESSION %s = '%s';"

LOGGER = get_logger('db_utils')


class _PGConnections:
    # A singleton classes to make connections once and then fetch them
    __instance = None

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = object.__new__(cls)

        return cls.__instance

    def __init__(self):
        self._engines = {}

    def get_engine(self, database_params) -> Engine:
        conn_string = "postgresql://{}:{}@{}/{}".format(database_params['user'],
                                                        database_params['password'],
                                                        database_params['host'],
                                                        database_params['database'])
        if conn_string not in self._engines:
            self._engines[conn_string] = sqlalchemy.create_engine(conn_string)

        return self._engines[conn_string]


def make_connection_kwargs(database_params: dict, username: str, setup_tx: bool = True, abort: bool = False):
    return {'database_params': database_params, 'username': username, 'setup_tx': setup_tx, 'abort': abort}


@contextmanager
def get_connection(**kwargs) -> Connection:
    database_params = kwargs['database_params']
    username = kwargs['username']
    setup_tx = kwargs['setup_tx']
    abort = kwargs['abort']

    engine = _PGConnections().get_engine(database_params)

    try:
        conn = engine.connect()
        if abort:
            yield 3
            LOGGER.info("yield 3")
            return
    except Exception as e:
        LOGGER.info("Got an e: " +str(e))
        raise e
    if abort:
        yield 3
        return
    tx = conn.begin()

    if setup_tx:
        _setup_transaction(conn, username)

    # This is where we'd set up session params if we want to do that
    try:
        yield conn
        tx.commit()
    finally:
        if not abort:
            conn.invalidate()


def _setup_transaction(conn, username):
    conn.exec_driver_sql('SET CONSTRAINTS ALL DEFERRED')
    conn.exec_driver_sql('SELECT reset_access()')
    conn.exec_driver_sql(f"SELECT session_add_user('{username}')")


def get_engine_user_postgres() -> Engine:
    return _PGConnections().get_engine({'database': 'postgres',
                                        'user': 'postgres',
                                        'host': 'datastore.datastore',
                                        'password': 'postgres'})
