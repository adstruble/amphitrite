from blueprints.login import start_session
from configs.gunicorn_conf_common import on_starting


def test_on_startup():
    on_starting(None)

def test_start_session():
    start_session()
