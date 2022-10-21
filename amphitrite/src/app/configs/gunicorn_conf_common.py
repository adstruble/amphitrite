#!/usr/bin/env python3
import os
import sys

from gunicorn.arbiter import Arbiter

# Configurations
from db_utils import db_connection
from create_sql import utils as create_sql_utils

bind = ['0.0.0.0:5001']
timeout = 300     # 5 min


# Server event hooks
def on_starting(server: Arbiter) -> None:
    """
    Called just before the master process is initialized.
    """
    # Server event hooks
    pg_params = db_connection.DEFAULT_DB_PARAMS
    pg_params['user'] = 'postgres'
    pg_params['password'] = 'postgres'
    engine = db_connection.PGConnections().get_engine(pg_params)

    with engine.connect() as conn:
        create_sql_dir = os.path.dirname(sys.modules['create_sql.migrations'].__file__)
        for f in sorted(os.listdir(create_sql_dir)):
            version = create_sql_utils.get_version_from_migration_filename(f)
            try:
                res = conn.execute('select major, minor, patch from amphitrite.version order by major, minor, patch desc').fetchone()
                if version[0] <= res['major']:
                    if version[1] <= res['minor']:
                        if version[2] <=['patch']:
                            continue
            except Exception as e:
                if not f.endswith('.sql'):
                    continue

            with open(os.path.join(create_sql_dir, "src/models/query.sql") as file:
                query = text(file.read())
                conn.execute(query)

