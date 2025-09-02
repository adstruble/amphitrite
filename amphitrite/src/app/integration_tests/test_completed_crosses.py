import pytest
from flask.testing import FlaskClient

from amphitrite import app as AmphitriteServer # noqa

from werkzeug.test import TestResponse

@pytest.fixture(scope="module")
def client() -> FlaskClient:
    AmphitriteServer.config['TESTING'] = True
    with AmphitriteServer.test_client() as client:
        yield client


def test_get_population_f_2013(client):
    resp: TestResponse = client.get('/cross_fish/inbreeding-coefficient?year=2013&pop_type=refuge',
                                    headers={'Content-Type': 'application/json', 'username': 'amphiadmin'})
    assert resp.status_code == 200
    f = resp.get_json()['success']

    assert f == 0

