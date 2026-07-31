import os
from datetime import date

import pytest

from amphitrite import app as AmphitriteServer
from db_utils.core import execute_statements, ResultType
from model.crosses import add_requested_cross, set_available_fish

from flask.testing import FlaskClient
from werkzeug.test import TestResponse

WARNING = ('Only 15 fish are available for crossing, you supplied a list of 20 fish tags. '
           'Confirm all tags were specified correctly and all the fish for the entered tags have '
           'previously been uploaded and are present in the Manage Fish UI as alive fish. Male fish '
           'that are from the same family as an available female fish have also been excluded.')
# The same-family pair may serialize in either order.
F_TAGS = ('RA42, YA26, RB24, YB28, RB29, (RB01, YB27), RB21, RG85, RX64',
          'RA42, YA26, RB24, YB28, RB29, (YB27, RB01), RB21, RG85, RX64')
M_TAGS = 'YA13, RB12, RB47, RG72, RX82'


def _available_fish_tags():
    with open(os.path.join(os.path.dirname(__file__), 'resources', 'available_fish', '10_males_10_females.csv')) as f:
        return [line.split('_')[0].strip().replace(',', '') for line in f.read().splitlines() if line.strip()]


@pytest.fixture
def current_year_available_fish():
    """Availability is filtered in SQL by ``refuge_tag.year = year(CURRENT_DATE)``, but the seed fish
    are tagged 2025 — so in any later calendar year none are found. Re-tag the *alive* entry of this
    test's fish to the current year (dynamically, so it never rots again; tags are reused across years
    and unique(tag, year) blocks a blanket update), run availability, then restore on teardown.

    Yields the ``set_available_fish`` result.
    """
    tags = _available_fish_tags()
    original = execute_statements(
        ("SELECT rt.id, rt.year FROM refuge_tag rt JOIN animal a ON a.id = rt.animal "
         "WHERE rt.tag = ANY(:t) AND a.alive = true", {'t': tags}),
        'amphiadmin', ResultType.RowResults).get_as_list_of_dicts()
    execute_statements(
        ("UPDATE refuge_tag rt SET year = :y FROM animal a WHERE a.id = rt.animal "
         "AND rt.tag = ANY(:t) AND a.alive = true", {'y': date.today().year, 't': tags}),
        'amphiadmin', ResultType.NoResult)

    result = set_available_fish('amphiadmin', tags)
    yield result

    execute_statements(['DELETE FROM requested_cross WHERE cross_date IS NULL', 'DELETE FROM possible_cross'],
                       'amphiadmin', ResultType.NoResult)
    for row in original:
        execute_statements(("UPDATE refuge_tag SET year = :y WHERE id = :id", {'y': row['year'], 'id': str(row['id'])}),
                           'amphiadmin', ResultType.NoResult)


@pytest.fixture(scope="module")
def client() -> FlaskClient:
    AmphitriteServer.config['TESTING'] = True
    with AmphitriteServer.test_client() as client:
        yield client


def test_get_available_blueprint(current_year_available_fish, client):
    assert current_year_available_fish['warning'] == WARNING

    resp: TestResponse = client.get('/cross_fish/available',
                                    headers={'Content-Type': 'application/json', 'username': 'amphiadmin'})
    assert resp.status_code == 200
    available = resp.get_json()['success']
    assert available['f_tags'] in F_TAGS
    assert available['uncrossed_tags'] in F_TAGS
    assert available['m_tags'] == M_TAGS


def _family_by_tag(tag):
    return str(execute_statements(
        ("SELECT a.family FROM refuge_tag rt JOIN animal a ON a.id = rt.animal "
         "WHERE rt.tag = :t AND a.alive = true", {'t': tag}),
        'amphiadmin', ResultType.RowResults).get_single_result())


def test_requested_saved_with_available_change(current_year_available_fish):
    # Two planned crosses; after narrowing availability to RX64 + YA13, only that cross survives.
    # (IDs resolved by tag; the previous hardcoded family UUIDs can't survive a fresh seed.)
    add_requested_cross('amphiadmin', _family_by_tag('RX64'), _family_by_tag('YA13'), 0.0032, False)
    add_requested_cross('amphiadmin', _family_by_tag('RA42'), _family_by_tag('RB12'), 0.0047, False)

    set_available_fish('amphiadmin', ["RX64", "YA13"])

    assert execute_statements(['SELECT count(*) from requested_cross where cross_date IS NULL'], 'amphiadmin',
                              ResultType.RowResults).get_single_result() == 1
