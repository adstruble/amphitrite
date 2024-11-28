import threading

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username, validate_and_create_upload_job
from utils.data import validate_order_by
from importer.import_master import import_master_data
from model.fish import get_fishes_from_db

manage_fish = Blueprint('manage_fish', __name__)

LOGGER = get_logger('manage-fish')


@manage_fish.route('/manage_fish/bulk_upload', methods=(['POST']))
def bulk_upload():
    job_id, username, t_file_dir = validate_and_create_upload_job(request)
    t = threading.Thread(name="import_master", target=import_master_data,
                         args=(t_file_dir, username, job_id, request.files['file'].filename),
                         daemon=True)
    t.start()
    return {"job_id": job_id}


@manage_fish.route('/manage_fish/get_fishes', methods=(['POST']))
def get_fishes():
    LOGGER.info("Getting fish")
    username_or_err = maybe_get_username(request.headers, "get fishes")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    query_params = request.get_json()
    order_by_clause = validate_order_by(query_params['order_by'],
                                        ['box', 'sex', 'group_id', 'f', 'di', 'tag', 'cross_date'], 'group_id ASC')
    db_fishes, db_fishes_size = get_fishes_from_db(username_or_err, query_params, order_by_clause)
    return {"success": {'data': db_fishes, 'size': db_fishes_size}}
