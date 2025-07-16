#!/usr/bin/env python3
from gunicorn.arbiter import Arbiter

from create_sql.initialize_db import load_seed_data, wait_for_postgres_and_upgrade
from utils.server_state import clean_jobs

# Configurations
bind = ['0.0.0.0:5001']
timeout = 300     # 5 min


# Server event hooks
def on_starting(server: Arbiter) -> None: # noqa
    """
    Called just before the master process is initialized.
    """
    # Server event hooks

    wait_for_postgres_and_upgrade()

    load_seed_data()

    # Clean the jobs in the server manager to start the clean job timer
    clean_jobs()
