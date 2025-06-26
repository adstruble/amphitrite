import datetime
import logging

import jwt

from db_utils.core import execute_statements, ResultType


def encode_auth_token(username, secret_key):
    """
    Generates the Auth Token
    :return: string
    """
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=0, seconds=5),
            'iat': datetime.datetime.utcnow(),
            'username': username
        }
        return jwt.encode(
            payload,
            secret_key
        )
    except Exception as e:
        logging.exception("Exception encoding session token")
        return e


def maybe_authenticate_user(username, p):
    if not (username and p):
        return None
    else:
        try:
            if execute_statements(('''SELECT enabled FROM amphi_user 
                                 WHERE username = :u
                                   AND password = :p''', {'u': username, 'p': p}),
                                  username=username).get_single_result():
                return username
        except: # noqa
            return None


def save_users_password(username, params: dict):
    params.update({'username': username})
    if (execute_statements(("UPDATE amphi_user set password = :password where username = :username",
                            params),
                           username=username, result_type=ResultType.RowCount).get_total_row_cnt() == 1):
        return {"success": 'Password updated'}

    return {"error": 'Password not updated'}


def disable_user_db(username, params: dict):
    if (execute_statements(
            ("UPDATE amphi_user set enabled = :enable where username = :username", params),
            username=username, result_type=ResultType.RowCount).get_total_row_cnt() == 1):
        return {"success": 'User disabled'}

    return {"error": 'Failed user disable'}


def add_user_to_db(username, params: dict):
    if (execute_statements((
            "INSERT into amphi_user (id, username, password, enabled) VALUES (gen_random_uuid(), :username, 'pass', true)", # noqa
                            params),
                           username=username, result_type=ResultType.RowCount).get_total_row_cnt() == 1):
        return {"success": 'User added'}

    return {"error": 'User not added'}


def delete_user_from_db(username, params: dict):
    if (execute_statements((
            "DELETE FROM amphi_user WHERE username =  :username", params),
            username=username, result_type=ResultType.RowCount).get_total_row_cnt() == 1):
        return {"success": 'User deleted'}
    return {"error": 'User not deleted'}


def get_user_rows(username, params: dict):

    users = execute_statements((
        "SELECT username, enabled FROM amphi_user ORDER BY username LIMIT :limit OFFSET :offset", params),
        username).get_as_list_of_dicts()

    user_cnt = execute_statements(("SELECT COUNT(*) FROM amphi_user LIMIT :limit", params),
                                  username).get_single_result()

    return users, user_cnt
