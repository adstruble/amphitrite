import datetime
import logging

import jwt


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
        logging.exception("Exception encoding session token", e)
        return e


def maybe_authenticate_user(username, password):
    if not (username and password):
        return None
    else:
        return username
