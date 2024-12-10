from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username
from model.user import save_users_password

users = Blueprint('users', __name__)

LOGGER = get_logger('users')


@users.route('/users/save_password', methods=(['POST']))
def save_password():
    username_or_err = maybe_get_username(request.headers, "save password")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    return save_users_password(username_or_err, request.get_json())

