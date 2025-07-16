from amphitrite import app


def test_login_success():
    with app.test_client() as client:
        response = client.post('/login', json={'username': 'amphiadmin', 'password': 'amphiadmin'})
        resp = response.get_json()
        assert len(resp['token']) > 100


def test_login_failure():
    with app.test_client() as client:
        response = client.post('/login', json={'username': 'nouser', 'password': 'pass'})
        resp = response.get_json()
        assert 'token' not in resp
