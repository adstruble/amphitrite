import os

import pytest

from amphitrite import app as AmphitriteServer
from model.crosses import set_available_fish

from flask.testing import FlaskClient
from werkzeug.test import TestResponse


@pytest.fixture
def set_cleanup_sqls(set_cleanup_sql_fn):
    set_cleanup_sql_fn('DELETE FROM possible_cross')


@pytest.fixture
def load_possible_crosses():
    with open(os.path.join(os.path.dirname(__file__), 'resources', 'available_fish', '10_males_10_females.csv'),
              'r') as available_fish_file:
        fish = []
        for line in available_fish_file.read().splitlines():
            fish.append(line.split('_')[0].strip().replace(',', ''))

    return set_available_fish('amphiadmin', fish)


@pytest.fixture(scope="module")
def client() -> FlaskClient:
    AmphitriteServer.config['TESTING'] = True
    with AmphitriteServer.test_client() as client:
        yield client


def test_get_available_blueprint(set_cleanup_sqls, load_possible_crosses, client):
    assert load_possible_crosses['warning'][
               'warning'] == ('Only 15 fish are available for crossing, you supplied a list of 20 fish tags. '
                              'Confirm all tags were specified correctly and all the fish for the entered tags have '
                              'previously been uploaded and are present in the Manage Fish UI as alive fish. Male fish '
                              'that are from the same family as an available female fish have also been excluded.')

    resp: TestResponse = client.get('/cross_fish/available',
                                    headers={'Content-Type': 'application/json', 'username': 'amphiadmin'})

    assert resp.status_code == 200
    available = resp.get_json()['success']
    assert (available['f_tags'] == 'RA42, YA26, RB24, YB28, RB29, (YB27, RB01), RB21, RG85, RX64') or \
    (available['f_tags'] == 'RA42, YA26, RB24, YB28, RB29, (RB01, YB27), RB21, RG85, RX64')
    assert (available['uncrossed_tags'] == 'RA42, YA26, RB24, YB28, RB29, (YB27, RB01), RB21, RG85, RX64') or \
           available['uncrossed_tags'] == 'RA42, YA26, RB24, YB28, RB29, (RB01, YB27), RB21, RG85, RX64'
    assert available['m_tags'] == 'YA13, RB12, RB47, RG72, RX82'
