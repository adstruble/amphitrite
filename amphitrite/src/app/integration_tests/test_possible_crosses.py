import os

import pytest

from amphitrite import app as AmphitriteServer
from db_utils.core import execute_statements, ResultType
from model.crosses import set_available_fish, add_requested_cross

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


def test_requested_saved_with_available_change(set_cleanup_sqls, load_possible_crosses):
    add_requested_cross('amphiadmin',
                        '42bea877-3bd9-4783-b8c3-caf8f41ba250',
                        'e451107d-a9af-446b-8fa5-1b17e631b57c',
                        0.003249539528042078,
                        False)
    add_requested_cross('amphiadmin',
                        '7a8a2f1d-4215-4c62-a8ec-586afe9dad77',
                        'c6736865-ff45-47c4-8965-f3ab1c6f592f',
                        0.004705953528173268,
                        False)

    set_available_fish('amphiadmin', ["RX64","YA13"])

    assert execute_statements(['SELECT count(*) from requested_cross where cross_date IS NULL'], 'amphiadmin',
                              ResultType.RowResults).get_single_result() == 1
