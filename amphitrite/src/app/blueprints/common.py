import io

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username
from species_config import get_species_config
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


@common.route('/common/config', methods=(['GET']))
def config_get():
    """
    Non-secret, UI-relevant deployment config: the species and its feature flags. The frontend
    reads this to decide which species-specific nav items and routes to show. Secrets (Sheet IDs,
    service-account key) are never included.
    """
    config = get_species_config()
    return {"species": config.species_name, "features": config.features()}
