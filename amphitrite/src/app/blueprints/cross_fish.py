import io

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import validate_order_by, maybe_get_username
from importer.import_master import import_master_data
from model.fish import get_fishes_from_db
from model.user import maybe_authenticate_user, encode_auth_token
from flask import current_app

manage_fish = Blueprint('cross_fish', __name__)

logger = get_logger('cross-fish')


@manage_fish.route('/cross_fish/upload_crosses', methods=(['POST']))
def bulk_upload():
    if 'file' not in request.files:
        logger.error("No file in request for uploaded crosses")
        return {"error": "No file in request for uploaded crosses"}

    username_or_err = maybe_get_username(request.headers, "upload crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    csv_data_as_text = io.TextIOWrapper(request.files['file'].stream, encoding="utf-8")
    return {"success": {'family': 0}}
