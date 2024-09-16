import tempfile
import threading

from flask import Blueprint, request, send_file

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username, validate_and_create_upload_job, clean_str_array, validate_params
from importer.import_crosses import import_crosses
from model.crosses import add_requested_cross, remove_requested_cross, get_requested_crosses_csv, \
    add_completed_cross, get_possible_crosses, get_count_possible_females, \
    select_available_female_tags, determine_and_insert_possible_crosses
from model.family import remove_family_by_tags

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


@cross_fish.route('/cross_fish/get_possible_crosses', methods=(['POST']))
def get_possible_crosses_api():
    username_or_err = maybe_get_username(request.headers, "getting best available crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    possible_crosses, possible_crosses_cnt = get_possible_crosses(username_or_err)
    return {"success": {'data': possible_crosses, 'size': possible_crosses_cnt}}


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


@cross_fish.route('/cross_fish/remove_completed_cross', methods=(['POST']))
def remove_completed_cross():
    LOGGER.info("Adding completed cross")
    username_or_err = maybe_get_username(request.headers, "adding completed cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()
    err_msg = validate_params(request_params, {'f_tag': str, 'm_tag': str})
    if err_msg is not None:
        return {"success": False, "level": "danger", "message": err_msg}

    deleted_record_cnt = remove_family_by_tags(username_or_err, request_params['f_tag'], request_params['m_tag'])
    if deleted_record_cnt != 1:
        if not deleted_record_cnt:
            deleted_record_cnt = 0
        return {"success": False, "level": "warning",
                "message": f"Expected deletion of 1 family record, {deleted_record_cnt} record" 
                           f"{' was' if deleted_record_cnt == 1 else 's were'} deleted."}
    return {"success": True}


@cross_fish.route('/cross_fish/set_available_females', methods=(['POST']))
def set_available_females():
    LOGGER.info("Available Females")

    username_or_err = maybe_get_username(request.headers, "adding completed cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()

    LOGGER.info(f"Setting available females: {request_params['f_tags']}")
    cleaned_f_tags = clean_str_array(request_params['f_tags'])

    try:
        insert_cnt = determine_and_insert_possible_crosses(username_or_err, cleaned_f_tags)
    except Exception as e:
        return {"success": False, "error": str(e)}

    return_val = {'success': True}
    if insert_cnt < len(request_params['f_tags']):
        possible_females_cnt = get_count_possible_females(username_or_err)
        if len(request_params['f_tags']) > possible_females_cnt:
            f_tags_len = len(request_params['f_tags'])
            return_val['warning'] = \
                f"{'' if possible_females_cnt == 0 else 'Only '}{possible_females_cnt} female fish are available " \
                f"for crossing. You supplied a list of {f_tags_len} female tag{'' if f_tags_len == 1 else 's'}. " \
                f"Confirm all the fish for the entered tags were added to the database and the tags have been " \
                f"specified as a comma separated list."

    return_val['data'] = select_available_female_tags(username_or_err)
    return return_val


@cross_fish.route('/cross_fish/get_available_f_tags', methods=(['POST']))
def get_available_f_tags():
    LOGGER.info("Get Available Female Tags")

    username_or_err = maybe_get_username(request.headers, "adding completed cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    f_tags = select_available_female_tags(username_or_err)

    return {'success': {'f_tags': f_tags}}
