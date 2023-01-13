import uuid

from flask import Blueprint, request, flash

from amphi_logging.logger import get_logger
from model.user import maybe_authenticate_user, encode_auth_token
from flask import current_app

login = Blueprint('managefish', __name__)

logger = get_logger('manage-fish')


@login.route('/managefish/uploadbulk', methods=(['POST']))
def uploadbulk():
    if 'file' not in request.files:
        logger.error("No file in request for upload bulk")
        return
    import_masterdata(request.files['file'])
