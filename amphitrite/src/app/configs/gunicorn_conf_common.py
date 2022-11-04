#!/usr/bin/env python3
import os
import sys
from time import sleep

from gunicorn.arbiter import Arbiter

# Configurations
from sqlalchemy import text

from create_sql.utils import apply_sql_migration
from create_sql import utils as create_sql_utils
from db_utils.db_connection import get_engine_user_postgres
from amphi_logging.logger import get_logger

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
                db_exists = conn.execute("SELECT datname FROM pg_catalog. pg_database WHERE datname = 'amphitrite'")\
                                .fetchone() is not None
                if not db_exists:
                    with open(os.path.join(create_sql_dir, "create_tables_V0.0.0.sql")) as sql_file:
                        query = text(sql_file.read())
                        conn.execute(query)

        except Exception as e:
            logger.warning(f"Unable to connect to postgres due to {e}, waiting {SLEEP_TIME}s before retrying.")
            attempt += 1
            sleep(1)

    for f in sorted(os.listdir(create_sql_dir)):
        try:
            version = create_sql_utils.get_version_from_migration_filename(f)
            res = conn.execute('SELECT major, minor, patch '
                               '  FROM amphitrite.version ORDER BY major, minor, patch DESC LIMIT 1').fetchone()
            if version[0] <= res['major']:
                if version[1] <= res['minor']:
                    if version[2] <= ['patch']:
                        continue

        except Exception as e:
            logger.exception("Exception applying SQL migration. Aborting SQL Migration.", e)
            return
