#!/usr/bin/env python3
import os
import sys
from logging.logger import get_logger

from gunicorn.arbiter import Arbiter

# Configurations
from create_sql.utils import apply_sql_migration
from create_sql import utils as create_sql_utils
from db_utils.db_connection import get_engine_user_postgres

bind = ['0.0.0.0:5001']
timeout = 300     # 5 min


# Server event hooks
def on_starting(server: Arbiter) -> None:
    """
    Called just before the master process is initialized.
    """
    # Server event hooks

    logger = get_logger('gunicorn.error')

    create_sql_dir = os.path.dirname(sys.modules['create_sql.migrations'].__file__)
    version = [0,0,-1]

    engine = get_engine_user_postgres()
    with engine.connect() as conn:
        db_exists = conn.execute("""
            SELECT count(*) FROM information_schema.tables
                WHERE  table_schema = 'amphitrite'
                AND    table_name   = 'version'
        )""").fetchone() > 0

    if not db_exists:
        apply_sql_migration(os.path.join(create_sql_dir, "create_tables_V0.0.0.sql"))

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
