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
        if execute_statements(('''SELECT enabled FROM amphi_user 
                             WHERE username = :u
                               AND password = :p''', {'u': username, 'p': p}),
                                  username=username).get_single_result():
            return username
    return None


def save_users_password(username, params: dict):
    params.update({'username': username})
    if (execute_statements(("UPDATE amphi_user set password = :password where username = :username",
                            params),
                           username=username, result_type=ResultType.RowCount).get_total_row_cnt() == 1):
        return {"success": 'Password updated'}
    else:
        return {"error": 'Password not updated'}
