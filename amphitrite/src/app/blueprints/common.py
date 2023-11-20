import io

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username
from utils.server_state import check_job

common = Blueprint('common', __name__)

logger = get_logger('common')


@common.route('/common/check_job/<job_id>', methods=(['GET']))
def check_job_get(job_id):
    """
    Checks on the status and result of the given job
    :param job_id: ID of job to check the state of
    :return: Returns state and result (empty string if still in progress)
    """

    state, result = check_job(job_id)
    return {"state": state, "result": result}
