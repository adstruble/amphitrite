import os
import tempfile
import uuid

from amphi_logging.logger import get_logger
from utils.server_state import add_server_job

LOGGER = get_logger()


def maybe_get_username(headers, request_error):
    try:
        return headers['username']
    except: # noqa
        LOGGER.error("Unable to process request, error accessing username from request headers.")
    return {"error": f"Request for {request_error} cannot be handled, due to error determining user"}


def validate_and_create_upload_job(request):
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

    return job_id, username_or_err, t_file_dir


def clean_str_array(items: list):
    return set([item.strip() for item in items])


def validate_params(param_dict:dict, expected_params: dict):
    for expected_param in expected_params.keys():
        if expected_param not in param_dict:
            return f"Expected param: {expected_param} of expected type {expected_params[expected_param]} was missing."
        if not isinstance(param_dict[expected_param], expected_params[expected_param]):
            return f"Expected param: {expected_param} was of incorrect type, was expecting {expected_params[expected_param]}" # noqa

    return None
