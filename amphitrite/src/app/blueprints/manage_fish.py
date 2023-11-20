import fileinput
import os.path
import tempfile
import threading
import uuid

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import validate_order_by, maybe_get_username
from importer.import_master import import_master_data
from model.fish import get_fishes_from_db
from utils.server_state import add_server_job

manage_fish = Blueprint('manage_fish', __name__)

LOGGER = get_logger('manage-fish')


@manage_fish.route('/manage_fish/bulk_upload', methods=(['POST']))
def bulk_upload():
    if 'file' not in request.files:
        LOGGER.error("No file in request for bulk upload")
        return {"error": "No file in request for bulk upload"}

    username_or_err = maybe_get_username(request.headers, "bulk upload")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    job_id = str(uuid.uuid4())
    t_file_dir = tempfile.TemporaryDirectory()
    t_file = open(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), mode='wb')
    t_file.write(request.files['file'].stream.read())
    t_file.close()

    add_server_job(job_id)
    t = threading.Thread(name="import_master", target=import_master_data,
                         args=(t_file_dir, username_or_err, job_id, request.files['file'].filename),
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
    order_by_clause = validate_order_by(query_params['order_by'], ['box', 'sex', 'group_id', 'tag'], 'group_id ASC')
    db_fishes, db_fishes_size = get_fishes_from_db(username_or_err, query_params, order_by_clause)
    return {"success": {'data': db_fishes, 'size': db_fishes_size}}
