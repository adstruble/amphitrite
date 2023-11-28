#!/usr/bin/env python3
import os
import sys
from time import sleep

from gunicorn.arbiter import Arbiter
from sqlalchemy import text

from create_sql.utils import apply_sql_migration
from create_sql import utils as create_sql_utils
from db_utils.common_selects import get_version
from db_utils.db_connection import get_engine_user_postgres, get_connection, AMPHIADMIN_DB_PARAMS
from amphi_logging.logger import get_logger
from exceptions.exceptions import DBConnectionError

# Configurations
bind = ['0.0.0.0:5001']
timeout = 300     # 5 min

WAIT_FOR_POSTGRES_TIME = 10
SLEEP_TIME = 1


# Server event hooks
def on_starting(server: Arbiter) -> None:
    """
    Called just before the master process is initialized.
    """
    # Server event hooks

    logger = get_logger('gunicorn.error')

    create_sql_dir = os.path.join(os.path.dirname(sys.modules['create_sql'].__file__), 'migrations')

    engine = get_engine_user_postgres()

    total_attempts = WAIT_FOR_POSTGRES_TIME / SLEEP_TIME
    attempt = 0
    while attempt < total_attempts:
        try:

            with engine.connect() as conn:
                db_exists = conn.execute(text("SELECT datname FROM pg_catalog. pg_database WHERE datname = 'amphitrite'"))\
                            .fetchone() is not None
            if not db_exists:
                with engine.connect() as conn:
                    conn.execute(text("CREATE USER amphiadmin "
                                 "WITH ENCRYPTED PASSWORD 'amphiadmin' CREATEROLE CONNECTION LIMIT 10"))
                    conn.execute(text('commit'))
                    conn.execute(text("CREATE DATABASE amphitrite WITH OWNER amphiadmin"))
                    conn.close()
                version = {'major': 0, 'minor': 0, 'patch': 0}
                break
            else:
                with get_connection(AMPHIADMIN_DB_PARAMS, 'amphiadmin', setup_tx=False) as conn:
                    version = get_version(conn)

        except Exception as e:
            logger.warning(f"Unable to connect to postgres due to {e}, waiting {SLEEP_TIME}s before retrying.")
            attempt += 1
            sleep(1)
            if attempt == total_attempts:
                raise DBConnectionError(f"Unable to connection to database after {total_attempts} attempts."
                                        f"Aborting amphitrite server startup")

    for f in sorted(os.listdir(create_sql_dir)):
        try:
            migration_version = create_sql_utils.get_version_from_migration_filename(f)
            if migration_version['major'] <= version['major']:  # noqa
                if migration_version['minor'] <= version['minor']:
                    if migration_version['patch'] <= version['patch']:
                        continue
            apply_sql_migration(os.path.join(create_sql_dir, f))
            logger.info(f"Applied sql migration: {migration_version}")
            version = migration_version

        except Exception as e:
            logger.exception("Exception applying SQL migration. Aborting SQL Migration.", e)
            return
