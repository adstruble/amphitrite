import io

from flask import Blueprint, request, flash

from amphi_logging.logger import get_logger
from importer.import_master import import_master_data
from model.user import maybe_authenticate_user, encode_auth_token
from flask import current_app

manage_fish = Blueprint('manage_fish', __name__)

logger = get_logger('manage-fish')


@manage_fish.route('/manage_fish/bulk_upload', methods=(['POST']))
def bulk_upload():
    if 'file' not in request.files:
        logger.error("No file in request for bulk upload")
        return {"error": "No file in request for bulk upload"}

    try:
        username = request.headers['username']
    except: # noqa
        logger.error("Unable to process request, error accessing username from request headers.")
        return {"error": "Request for bulk upload cannot be handled, due to error determining user"}

    csv_data_as_text = io.TextIOWrapper(request.files['file'].stream, encoding="utf-8")
    return import_master_data(csv_data_as_text, username)