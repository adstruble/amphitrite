from configs.gunicorn_conf_common import on_starting


def test_on_startup():
    on_starting(None)
