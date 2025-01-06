import uuid
from time import sleep

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from model.user import maybe_authenticate_user, encode_auth_token
from flask import current_app

login = Blueprint('login', __name__)

logger = get_logger('login')


@login.route('/login', methods=(['POST']))
def start_session():
    data ={'username':'amphiadmin','password':'amphiadmin'}# request.get_json()
    username = data['username']
    password = data['password']

    logger.info(f"Logging in user {username}")
    user_id = maybe_authenticate_user(username, password)
    logger.info(f"logged in {user_id}")
    if not user_id:
        logger.warning("Authentication failed returning empty token")
        return {}

    token = encode_auth_token(user_id, current_app.config.get('SECRET_KEY'))
    logger.info(f"Authentication succeeded")
    return {"token": token}
