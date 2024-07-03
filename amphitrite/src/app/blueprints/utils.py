import os
import tempfile
import uuid

from amphi_logging.logger import get_logger
from utils.server_state import add_server_job

LOGGER = get_logger()


def validate_order_by(order_bys: list, valid_values, default=None):
    """
    Checks if given param value is one of given valid_values. If so, it will return it. If not, returns the
    default, if default is not given, None is returned
    :param order_bys: OrderBys to check for validity
    :param valid_values: possible valid values
    :param default:
    :return: param is value is valid, otherwise default if it is given, otherwise None
    """
    LOGGER.info(f"Valid order bys: {valid_values}")
    order_by_cols = ""
    for order_by in order_bys:
        LOGGER.info(f"order by: {order_by}END")
        col, direction = order_by.split(",")
        if col not in valid_values or not (direction == 'ASC' or direction == 'DESC'):
            continue
        order_by_cols = f"{order_by_cols}{col} {direction}, "
    if not order_by_cols:
        LOGGER.info(f"Using default order by: {default}")
        return f"ORDER BY {default}"
    return f"ORDER BY {order_by_cols[:-2]}"


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
