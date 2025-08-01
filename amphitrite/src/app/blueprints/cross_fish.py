import csv
import os
import tempfile
import threading

from flask import Blueprint, request, send_file

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username, validate_and_create_upload_job, clean_str_array, validate_params
from importer.import_crosses import import_crosses
from model.crosses import add_requested_cross, remove_requested_cross, get_requested_crosses_csv, \
    add_completed_cross, get_possible_crosses, \
    get_available_female_tags_str, get_completed_crosses, set_cross_failed, \
    set_use_for_supplementation, get_exported_crosses_csv, get_completed_crosses_by_family, set_available_females, \
    get_available_females_with_0_or_1_males, get_population_f
from model.family import remove_family_by_tags, set_family_mfg, save_family_notes
from utils.data import validate_order_by

cross_fish = Blueprint('cross_fish', __name__)

LOGGER = get_logger('cross-fish')


@cross_fish.route('/cross_fish/upload_completed_crosses', methods=(['POST']))
def bulk_upload():

    LOGGER.info(f"Uploading crossed fish")
    job_id, username, t_file_dir = validate_and_create_upload_job(request)

    t = threading.Thread(name="import_crosses", target=import_crosses,
                         args=(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), username, job_id),
                         daemon=True)
    t.start()
    return {"job_id": job_id}


@cross_fish.route('/cross_fish/get_possible_crosses', methods=(['POST']))
def get_possible_crosses_api():
    username_or_err = maybe_get_username(request.headers, "getting best available crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    query_params = request.get_json()

    possible_crosses, possible_crosses_cnt = get_possible_crosses(username_or_err, query_params)
    return {"success": {'data': possible_crosses, 'size': possible_crosses_cnt}}


@cross_fish.route('/cross_fish/add_selected_cross', methods=(['POST']))
def add_selected_cross():
    LOGGER.info("Adding selected cross")
    username_or_err = maybe_get_username(request.headers, "adding selected cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()
    ids = request_params['cross_id'].split("__")

    requests = add_requested_cross(username_or_err, ids[0], ids[1], request_params['f'],
                                   request_params['supplementation'])
    uncrossed_tags = get_available_females_with_0_or_1_males(username_or_err)
    return {"success": requests == 1, "data": {"uncrossed_tags": uncrossed_tags}}


@cross_fish.route('/cross_fish/remove_selected_cross', methods=(['POST']))
def remove_selected_cross():
    LOGGER.info("Removing selected cross")
    username_or_err = maybe_get_username(request.headers, "removing selected cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()
    ids = request_params['cross_id'].split("__")

    requests = remove_requested_cross(username_or_err, ids[0], ids[1])
    uncrossed_tags = get_available_females_with_0_or_1_males(username_or_err)
    return {"success": requests == 1, "data": {"uncrossed_tags": uncrossed_tags}}


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
                                  request_params['f'], request_params['cross_completed_date'],
                                  'supplementation_family' if request_params['supplementation'] else 'family',
                                  request_params['requested_cross'])

    uncrossed_tags = get_available_females_with_0_or_1_males(username_or_err)

    return {"success": success, "data": {'uncrossed_tags': uncrossed_tags}}


@cross_fish.route('/cross_fish/remove_completed_cross', methods=(['POST']))
def remove_completed_cross():
    LOGGER.info("Removing completed cross")
    username_or_err = maybe_get_username(request.headers, "adding completed cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()
    err_msg = validate_params(request_params, {'f_tag': str, 'm_tag': str})
    if err_msg is not None:
        return {"success": False, "level": "danger", "message": err_msg}

    deleted_record_cnt = remove_family_by_tags(username_or_err, request_params['f_tag'], request_params['m_tag'])
    result = {"success": True}
    if deleted_record_cnt != 1:
        if not deleted_record_cnt:
            deleted_record_cnt = 0

        result = {"success": False, "level": "warning",
                  "message": f"Expected deletion of 1 family record, {deleted_record_cnt} record" 
                             f"{' was' if deleted_record_cnt == 1 else 's were'} deleted."}

    uncrossed_tags = get_available_females_with_0_or_1_males(username_or_err)
    result["data"] = {'uncrossed_tags': uncrossed_tags}
    return result


@cross_fish.route('/cross_fish/set_available_females_from_file', methods=(['POST']))
def set_available_females_from_file():
    LOGGER.info("Setting available fish from file")
    username_or_err = maybe_get_username(request.headers, "bulk upload")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    try:
        females = []
        for line in request.files['file'].stream.read().splitlines():
            LOGGER.info(f"row: {line.decode('utf-8-sig').split('_')[0].strip()}")
            females.append(line.decode('utf-8-sig').split('_')[0].strip())

        return set_available_females(username_or_err, females)
    except Exception as e:
        return {"success": False, "error": str(e)}


@cross_fish.route('/cross_fish/set_available_females', methods=(['POST']))
def set_available_females_from_comma_seperated_list():
    LOGGER.info("Setting available females from list")

    username_or_err = maybe_get_username(request.headers, "adding completed cross")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    request_params = request.get_json()

    LOGGER.info(f"Setting available females: {request_params['f_tags']}")
    cleaned_f_tags = clean_str_array(request_params['f_tags'])

    return set_available_females(username_or_err, cleaned_f_tags)


@cross_fish.route('/cross_fish/get_available_f_tags', methods=(['POST']))
def get_available_f_tags():
    LOGGER.info("Get Available Female Tags")

    username_or_err = maybe_get_username(request.headers, "getting available ftags")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    f_tags = get_available_female_tags_str(username_or_err)
    uncrossed_tags = get_available_females_with_0_or_1_males(username_or_err)

    return {'success': {'f_tags': f_tags, 'uncrossed_tags': uncrossed_tags}}


@cross_fish.route('/cross_fish/get_completed_crosses', methods=(['POST']))
def get_completed_crosses_api():
    LOGGER.info("Get Completed Crosses")

    username_or_err = maybe_get_username(request.headers, "getting completed crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    query_params = request.get_json()

    order_by_clause = validate_order_by(query_params['order_by'],
                                        ['mfg', 'completed_cross.group_id', 'f', 'di', 'f_tag', 'm_tag',
                                         'xf.group_id', 'yf.group_id', 'cross_date', 'x_crosses', 'y_crosses'],
                                        'cross_date')

    completed_crosses, completed_crosses_cnt = get_completed_crosses(username_or_err, query_params, order_by_clause,
                                                                     filter_str='completed_cross.cross_year=:year')
    return {"success": {'data': completed_crosses, 'size': completed_crosses_cnt}}


@cross_fish.route('/cross_fish/get_completed_crosses_by_family', methods=(['POST']))
def get_completed_crosses_by_family_api():
    LOGGER.info("Get Completed Crosses by family")

    username_or_err = maybe_get_username(request.headers, "getting completed crosses by family")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    query_params = request.get_json()

    completed_crosses, completed_crosses_cnt = get_completed_crosses_by_family(username_or_err, query_params)
    return {"success": {'data': completed_crosses, 'size': completed_crosses_cnt}}


@cross_fish.route('/cross_fish/get_completed_crosses_by_family_cnt', methods=(['POST']))
def get_completed_crosses_by_family_cnt():
    LOGGER.info("Get Completed Crosses by Family Count")

    username_or_err = maybe_get_username(request.headers, "getting completed crosses by family")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    query_params = request.get_json()
    fam_ids = query_params.pop('fam_ids')

    results = {'refuge':{}, 'supplementation':{}}
    for fam_id in fam_ids:
        query_params['fam_id'] = fam_id
        query_params['refuge'] = True
        _, completed_crosses_cnt = get_completed_crosses_by_family(username_or_err, query_params, True)
        results['refuge'][fam_id] = completed_crosses_cnt
        query_params['refuge'] = False
        _, completed_crosses_cnt = get_completed_crosses_by_family(username_or_err, query_params, True)
        results['supplementation'][fam_id] = completed_crosses_cnt

    return {"success": results}


@cross_fish.route('/cross_fish/set_mfg', methods=(['POST']))
def set_family_mfg_api():
    LOGGER.info("Setting family MFG")

    username_or_err = maybe_get_username(request.headers, "getting completed crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    params= request.get_json()
    try:
        mfg = int(params.get('mfg'))
    except: # noqa
        return {"error": "MFG must be an integer"}

    set_family_mfg(username_or_err, params)
    return {"success": mfg}


@cross_fish.route('/cross_fish/set_cross_failed', methods=(['POST']))
def set_cross_failed_api():
    LOGGER.info("Set cross failed")

    username_or_err = maybe_get_username(request.headers, "setting cross failed")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    params = request.get_json()
    set_cross_failed(username_or_err, params)
    return {"success": "Cross failed set"}


@cross_fish.route('/cross_fish/set_use_for_supplementation', methods=(['POST']))
def set_use_for_supplementation_api():
    LOGGER.info("Set use for supplementation")

    username_or_err = maybe_get_username(request.headers, "setting used for supplementation")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    params = request.get_json()
    set_use_for_supplementation(username_or_err, params)
    return {"success": "Set used for supplementation"}


@cross_fish.route('/cross_fish/export_crosses', methods=(['POST']))
def export_crosses_api():
    LOGGER.info("Exporting crosses")

    username_or_err = maybe_get_username(request.headers, "exporting crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    params = request.get_json()
    with tempfile.NamedTemporaryFile(mode='w') as temp_crosses_csv:
        get_exported_crosses_csv(username_or_err, params, temp_crosses_csv)
        temp_crosses_csv.flush()
        return send_file(temp_crosses_csv.name, as_attachment=True)


@cross_fish.route('/cross_fish/save_notes', methods=(['POST']))
def save_family_notes_api():
    LOGGER.info("Saving family notes")
    username_or_err = maybe_get_username(request.headers, "exporting crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    params = request.get_json()
    table_name = 'supplementation_family' if params.pop('supplementation') else 'family'
    save_family_notes(username_or_err, table_name, query_params=params)

    return {"success": True}


@cross_fish.route('/cross_fish/inbreeding-coefficient', methods=(['GET']))
def get_population_inbreeding_coefficient():
    LOGGER.info("Retrieving population inbreeding coefficient")
    username_or_err = maybe_get_username(request.headers, "exporting crosses")
    if isinstance (username_or_err, dict): # noqa
        return username_or_err

    year = request.args.get('year')
    pop_type = request.args.get('pop_type').lower()

    return {"success": get_population_f(username_or_err, year, pop_type)}
