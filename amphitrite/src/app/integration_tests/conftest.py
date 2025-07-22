import inspect
import os
import subprocess
import uuid
from unittest.mock import patch

import pytest

from create_sql.initialize_db import wait_for_postgres_and_upgrade, load_seed_data
from db_utils.core import ResultType, execute_statements
from db_utils.db_connection import POSTGRES_SERVER_HOSTNAME_ENV, get_postgres_hostname
from importer.import_master import import_master_data

POSTGRES_DOCKER_CONTAINER = "POSTGRES_DOCKER_CONTAINER"
dockerContainerName = os.getenv(POSTGRES_DOCKER_CONTAINER)
REMAIN_RUNNING_ON_ERROR_ENV = "REMAIN_RUNNING_ON_ERROR"
REMAIN_RUNNING_ON_ERROR = os.getenv(REMAIN_RUNNING_ON_ERROR_ENV)

USING_FIXED_CONTAINER_NAME = True if dockerContainerName else False
CONTAINER_UNIQUE_ID = str(uuid.uuid4())


def pytest_sessionstart(session): # noqa

    setup_postgres()
    os.environ[POSTGRES_SERVER_HOSTNAME_ENV] = 'localhost'
    print(f"Postgres Hostname: {get_postgres_hostname()}\n")
    print(f"Log dir: {os.getenv('LOG_BASE_DIR', '/tmp')}")

    wait_for_postgres_and_upgrade()

    cleanup_last_test()


@pytest.hookimpl(trylast=True)  # Needed so that sessionfinish is called after other fixtures finish their yield work.
def pytest_sessionfinish(session, exitstatus):
    cleanup_postgres(exitstatus)


@pytest.fixture(autouse=True, scope='session')
def seed_pedigree():
    # Need to patch complete_job in both the master and requested crosses importers because both imports
    # are done to seed spawning season 2024
    with patch('importer.import_master.complete_job') as _:
        with patch('importer.import_crosses.complete_job') as __:
            load_seed_data()


@pytest.fixture(autouse=True, scope='session')
def load_2025_master(seed_pedigree):
    with patch('importer.import_master.complete_job') as _:
        import_master_data(os.path.join(os.path.dirname(__file__), 'resources'), 'amphiadmin', '2025.csv', 2025)


@pytest.fixture()
def set_cleanup_sql_fn():
    # During cleanup, which is executed at session start up after postgres is set up and migrated (setup and migration
    # will not actually occur if the container is already up, which is why cleanup is necessary),
    # test cleanup-sql will be executed in the order it was added.
    execute_statements([
        "DROP TABLE IF EXISTS cleanup_sql",
        "CREATE TABLE cleanup_sql (test_fn text, cleanup_sql text, created_at TIMESTAMPTZ DEFAULT NOW())"],
        'amphiadmin', ResultType.NoResult)

    def set_cleanup_sql(cleanup_sql):
        test_fn = inspect.stack()[1].function
        execute_statements([("INSERT INTO cleanup_sql (test_fn, cleanup_sql) VALUES (:test_fn, :sql)",
                             {'test_fn': test_fn, 'sql': cleanup_sql})], 'amphiadmin', ResultType.NoResult)

    return set_cleanup_sql


def setup_postgres():
    if USING_FIXED_CONTAINER_NAME:
        print(f"Using fixed image!! {USING_FIXED_CONTAINER_NAME}")
        # Using the find_pg_hostname to check if docker container exists, but not actually using the result as
        # we're always running tests locally and not within docker network so we will use localhost with exposed port
        pg_hostname = find_pg_hostname(get_docker_container_name())
        if pg_hostname:
            return

    print(f"POSTGRES_DOCKER_CONTAINER Env var: {os.getenv(POSTGRES_DOCKER_CONTAINER)}")
    print(f"Container name: {get_docker_container_name()}")

    print("Spinning up postgres container")
    spinup_postgres_container()

    return


def cleanup_last_test():
    # If the cleanup_sql table exists, iterate over its rows, executing all the sql commands.
    if execute_statements("SELECT count(*) FROM information_schema.tables WHERE table_name = 'cleanup_sql'",
                          'amphiadmin').get_single_result():
        for cleanup_sql in execute_statements(["SELECT test_fn, cleanup_sql FROM cleanup_sql ORDER BY created_at"],
                                              'amphiadmin', ResultType.RowResults).row_results:
            print(f'Cleaning up from test: {cleanup_sql[0]}, executing: {cleanup_sql[1]}')
            execute_statements([cleanup_sql[1]], 'amphiadmin',
                               ResultType.NoResult)


def get_docker_container_name():
    if USING_FIXED_CONTAINER_NAME:
        return dockerContainerName
    else:
        return f"postgres_docker_{CONTAINER_UNIQUE_ID}"


def find_pg_hostname(container_name):
    cmd = ["docker", "inspect", "--format", "{{ .NetworkSettings.IPAddress }}", container_name]

    # start and block until done
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()

    timeout = 120
    if USING_FIXED_CONTAINER_NAME:
        timeout = 2
    if p.wait(timeout=timeout):
        if USING_FIXED_CONTAINER_NAME:
            return False
        assert False, f"Failure getting postgres hostname stderr:{stderr.decode()}, stdout:{stdout.decode()}"

    return stdout.decode()[:-1]


def spinup_postgres_container():
    # The following command has the following options/meanings:

    # -d (detached mode)
    # -e (environment variables required for Postgres to run without Luna)
    # --rm (removes the container once its stopped)
    cmd = ["docker", "run",
           "-p", "5432:5432",
           "-d",
           "-e", "LISTEN_ADDRESS=0.0.0.0",
           "-e", "CLIENT_SUBNET=0.0.0.0/0",
           "--name", get_docker_container_name(),
           "--rm",
           "--shm-size=1g",
           "amphitrite/datastore:0.1.0"]

    # start and block until done
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()

    if p.wait(timeout=120):
        assert False, f"Failure spinning up postgres stderr:{stderr.decode()}, stdout:{stdout.decode()}"


def cleanup_postgres(exitstatus):
    print(f"Pytest exit status: {exitstatus}")
    if exitstatus != 0 and REMAIN_RUNNING_ON_ERROR:
        print("A test error was indicated, leaving the docker container running for inspection.")
        return

    if USING_FIXED_CONTAINER_NAME:
        # We won't turn off if we're using a fixed instance.
        print("Skipping postgres cleanup as container name was included as env variable")
        return

    print(f"Cleaning up {get_docker_container_name()} with hostname: {get_postgres_hostname()}")

    # Since we start the container with the --rm option, we do not need to worry about cleaning it up
    cmd = ["docker", "stop", get_docker_container_name()]

    # We do not wrap this in a try/catch because in any case of failure, we want to be loud.
    # The integration tests should clean up the Postgres container
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()

    if p.wait(timeout=120):
        assert False, f'Process {cmd} failed stderr: {stderr.decode()} stdout: {stdout.decode()}'
