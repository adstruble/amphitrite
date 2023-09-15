import io

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import validate_param
from importer.import_master import import_master_data
from model.fish import get_fishes_from_db
from model.user import maybe_authenticate_user, encode_auth_token
from flask import current_app

manage_fish = Blueprint('manage_fish', __name__)

logger = get_logger('manage-fish')


@manage_fish.route('/manage_fish/bulk_upload', methods=(['POST']))
def bulk_upload():
    if 'file' not in request.files:
        logger.error("No file in request for bulk upload")
        return {"error": "No file in request for bulk upload"}

    username_or_err = maybe_get_username(request.headers, "bulk upload")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    csv_data_as_text = io.TextIOWrapper(request.files['file'].stream, encoding="utf-8")
    return import_master_data(csv_data_as_text, username_or_err)


@manage_fish.route('/manage_fish/get_fishes', methods=(['POST']))
def get_fishes():

    username_or_err = maybe_get_username(request.headers, "get fishes")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    query_params = request.get_json()
    query_params['order_by'] = validate_param(query_params['order_by'],
                                              ['box', 'sex', 'group_id', 'tag'],
                                              'group_id')
    db_fishes = get_fishes_from_db(username_or_err, query_params)
    return {"success": db_fishes}


def maybe_get_username(headers, request_error):
    try:
        return headers['username']
    except: # noqa
        logger.error("Unable to process request, error accessing username from request headers.")
    return {"error": f"Request for {request_error} cannot be handled, due to error determining user"}
