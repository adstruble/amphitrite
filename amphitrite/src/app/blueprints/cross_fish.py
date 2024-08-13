import tempfile
import threading

from flask import Blueprint, request, send_file

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username, validate_and_create_upload_job
from cross_selection.f_calculation import rank_available_crosses_by_f
from importer.import_crosses import import_crosses
from cross_selection.crosses import add_requested_cross, remove_requested_cross, get_requested_crosses_csv, \
    add_completed_cross

cross_fish = Blueprint('cross_fish', __name__)

LOGGER = get_logger('cross-fish')


@cross_fish.route('/cross_fish/upload_crosses', methods=(['POST']))
def bulk_upload():
    job_id, username, t_file_dir = validate_and_create_upload_job(request)

    t = threading.Thread(name="import_master", target=import_crosses,
                         args=(t_file_dir, username, job_id),
                         daemon=True)
    t.start()
    return {"job_id": job_id}


@cross_fish.route('/cross_fish/get_best_available', methods=(['POST']))
def get_best_available_crosses():
    LOGGER.info("Getting best available crosses")
    username_or_err = maybe_get_username(request.headers, "getting best available crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    available_crosses, available_crosses_cnt = rank_available_crosses_by_f(username_or_err)
    return {"success": {'data': available_crosses, 'size': available_crosses_cnt}}


@cross_fish.route('/cross_fish/add_selected_cross', methods=(['POST']))
def add_selected_cross():
    LOGGER.info("Adding selected cross")
    username_or_err = maybe_get_username(request.headers, "adding selected cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()
    ids = request_params['cross_id'].split("__")
    f = request_params['f']

    requests = add_requested_cross(username_or_err, ids[0], ids[1], f)
    return {"success": requests == 1, "data": []}


@cross_fish.route('/cross_fish/remove_selected_cross', methods=(['POST']))
def remove_selected_cross():
    LOGGER.info("Removing selected cross")
    username_or_err = maybe_get_username(request.headers, "removing selected cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()
    ids = request_params['cross_id'].split("__")

    requests = remove_requested_cross(username_or_err, ids[0], ids[1])
    return {"success": requests == 1, "data": []}


@cross_fish.route('/cross_fish/export_selected_crosses', methods=(['POST']))
def export_selected_crosses():
    LOGGER.info("Exporting selected crosses")
    username_or_err = maybe_get_username(request.headers, "exporting selected crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    with tempfile.NamedTemporaryFile(mode='w') as temp_crosses_csv:
        get_requested_crosses_csv(username_or_err, temp_crosses_csv)
        temp_crosses_csv.flush()
        return send_file(temp_crosses_csv.name, as_attachment=True)


@cross_fish.route('/cross_fish/set_cross_completed', methods=(['POST']))
def set_cross_completed():
    LOGGER.info("Adding completed cross")
    username_or_err = maybe_get_username(request.headers, "adding completed cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()

    success = add_completed_cross(username_or_err, request_params['f_tag'], request_params['m_tag'],
                                  request_params['f'])
    return {"success": success, "data": []}


@cross_fish.route('/cross_fish/set_available_females', methods=(['POST']))
def set_available_females():
    LOGGER.info("Available Females")

    username_or_err = maybe_get_username(request.headers, "adding completed cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()

    LOGGER.info(f"Setting available females: {request_params['f_tags']}")

    return {"success": True, "data": []}
