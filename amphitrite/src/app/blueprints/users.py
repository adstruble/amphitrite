from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username
from model.user import save_users_password, get_user_rows, add_user_to_db, delete_user_from_db, disable_user_db

users = Blueprint('users', __name__)

LOGGER = get_logger('users')


@users.route('/users/save_password', methods=(['POST']))
def save_password():
    username_or_err = maybe_get_username(request.headers, "save password")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    return save_users_password(username_or_err, request.get_json())


@users.route('/users/get_users', methods=(['POST']))
def get_users():
    username_or_err = maybe_get_username(request.headers, "save password")
    if isinstance (username_or_err, dict): # noqae
        return username_or_err

    user_rows, users_cnt, = get_user_rows(username_or_err, request.get_json())
    return {"success": {'data': user_rows, 'size': users_cnt}}


@users.route('/users/add_user', methods=(['POST']))
def add_user():
    username_or_err = maybe_get_username(request.headers, "save password")
    if isinstance (username_or_err, dict): # noqae
        return username_or_err

    return add_user_to_db(username_or_err, request.get_json())


@users.route('/users/delete_user', methods=(['POST']))
def delete_user():
    username_or_err = maybe_get_username(request.headers, "delete password")
    if isinstance (username_or_err, dict): # noqae
        return username_or_err

    return delete_user_from_db(username_or_err, request.get_json())


@users.route('/users/disable_user', methods=(['POST']))
def disable_user():
    username_or_err = maybe_get_username(request.headers, "disable user")
    if isinstance (username_or_err, dict): # noqae
        return username_or_err

    return disable_user_db(username_or_err, request.get_json())
