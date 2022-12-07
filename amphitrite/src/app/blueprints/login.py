import uuid

from flask import Blueprint, request

from model.user import maybe_authenticate_user, encode_auth_token

login = Blueprint('login', __name__)


@login.route('/login')
def start_session():
    data = request.get_json()
    username = data['username']
    password = data['password']

    user_id = maybe_authenticate_user(username, password)
    if not user_id:
        return {}

    token = encode_auth_token(user_id)
    return {"token": token}
