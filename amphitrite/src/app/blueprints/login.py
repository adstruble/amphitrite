import uuid

from flask import Blueprint

login = Blueprint('login', __name__)


@login.route('/startSession')
def start_session():
    return {"token": uuid.UUID}

