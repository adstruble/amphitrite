import io
import threading

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username, validate_and_create_upload_job
from importer.import_crosses import import_crosses

cross_fish = Blueprint('cross_fish', __name__)

logger = get_logger('cross-fish')


@cross_fish.route('/cross_fish/upload_crosses', methods=(['POST']))
def bulk_upload():
    job_id, username, t_file_dir = validate_and_create_upload_job(request)

    t = threading.Thread(name="import_master", target=import_crosses,
                         args=(t_file_dir, username, job_id),
                         daemon=True)
    t.start()
    return {"job_id": job_id}
