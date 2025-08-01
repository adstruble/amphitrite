import os
import sys
from time import sleep

from sqlalchemy import text

from amphi_logging.logger import get_logger
from create_sql.utils import get_version_from_migration_filename, apply_sql_migration
from db_utils.common_selects import get_version
from db_utils.db_connection import get_engine_user_postgres, make_connection_kwargs, get_amphiadmin_db_params, \
    get_connection
from exceptions.exceptions import DBConnectionError
from importer.import_crosses import import_crosses
from importer.import_master import import_master_data
from importer.import_pedigree import maybe_import_pedigree
from importer.import_utils import get_import_resources_dir
from model.fish import mark_all_fish_dead

LOGGER = get_logger('create_sql.initialize_db')

WAIT_FOR_POSTGRES_TIME = 10
SLEEP_TIME = 1


def wait_for_postgres_and_upgrade():
    create_sql_dir = os.path.join(os.path.dirname(sys.modules['create_sql'].__file__), 'migrations')

    engine = get_engine_user_postgres()

    total_attempts = WAIT_FOR_POSTGRES_TIME / SLEEP_TIME
    attempt = 0
    while attempt < total_attempts:
        try:
            with engine.connect() as conn:
                db_exists = conn.execute(text(
                    "SELECT datname FROM pg_catalog. pg_database WHERE datname = 'amphitrite'")).fetchone() is not None
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
                kwargs = make_connection_kwargs(database_params=get_amphiadmin_db_params(),
                                                username='amphiadmin',
                                                setup_tx=False)
                with get_connection(**kwargs) as conn:
                    version = get_version(conn)
                    LOGGER.info(f"Database exists at version: {version}")
                    break

        except Exception as e:
            LOGGER.warning(f"Unable to connect to postgres due to {e}, waiting {SLEEP_TIME}s before retrying.")
            attempt += 1
            sleep(1)
            if attempt == total_attempts:
                raise DBConnectionError(f"Unable to connection to database after {total_attempts} attempts."
                                        f"Aborting amphitrite server startup")

    for f in sorted(os.listdir(create_sql_dir)):
        try:
            migration_version = get_version_from_migration_filename(f)
            if migration_version['major'] < version['major']:
                continue
            if migration_version['major'] == version['major'] and migration_version['minor'] < version['minor']:
                continue
            if (migration_version['major'] == version['major'] and migration_version['minor'] == version['minor']
                    and migration_version['patch'] <= version['patch']):
                continue
            apply_sql_migration(os.path.join(create_sql_dir, f))
            LOGGER.info(f"Applied sql migration: {migration_version}")
            version = migration_version

        except Exception: # noqa
            LOGGER.exception("Exception applying SQL migration. Aborting SQL Migration.")
            return


def load_seed_data():
    if maybe_import_pedigree():
        # Import master data sheet used in 2024 (Master tab from Final_BY2023_Mastersheet_MF)
        import_master_data(get_import_resources_dir(), 'amphiadmin', 'master_data_2023BY.csv', 2024)
        # Import the crosses made in 2024 (Recommended Crosses tab from Final_BY2023_Mastersheet_MF)
        crosses_path = os.path.join(get_import_resources_dir(), "bulk_upload_crosses_2024.csv")
        import_crosses(crosses_path, 'amphiadmin', 2024, 2024)
        mark_all_fish_dead('amphiadmin')
