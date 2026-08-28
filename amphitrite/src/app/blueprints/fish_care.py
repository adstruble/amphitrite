import os
import threading
import uuid

from flask import Blueprint, request

from amphi_logging.logger import get_logger
from blueprints.utils import maybe_get_username, run_upload_job_and_cleanup, validate_and_create_upload_job
from importer import google_sheets
from importer.import_fish_care import build_preview, import_fish_care_xlsx, parse_workbook
from model.fish_care import get_fish_care, persist_sheets
from species_config import get_species_config
from utils.data import validate_order_by
from utils.server_state import JobState, add_server_job, check_job, complete_job

# Columns the client may sort by (whitelist guards against SQL injection via order_by).
_SORTABLE_COLUMNS = ['obs_date', 'facility', 'system', 'tank_id', 'carer', 'temp', 'dissolved_oxygen',
                     'salinity', 'ph', 'turbidity', 'ammonia', 'nitrite', 'nitrate', 'morts', 'notes']

fish_care = Blueprint('fish_care', __name__)

LOGGER = get_logger('fish_care')


@fish_care.route('/fish_care/get_records', methods=(['POST']))
def get_records():
    """Paginated/sorted/filtered fish care records for the AmphiTable view."""
    username = maybe_get_username(request.headers, "fish care records")
    if isinstance(username, dict):
        return username
    query_params = request.get_json()
    order_by_clause = validate_order_by(query_params['order_by'], _SORTABLE_COLUMNS, 'obs_date DESC NULLS LAST')
    rows, size = get_fish_care(username, query_params, order_by_clause)
    return {"success": {'data': rows, 'size': size}}


@fish_care.route('/fish_care/bulk_upload', methods=(['POST']))
def bulk_upload():
    """xlsx upload fallback. Parses + persists in a background thread (existing job/poll contract)."""
    result = validate_and_create_upload_job(request)
    if isinstance(result, dict):  # error dict
        return result
    job_id, username, t_file_dir = result
    # run_upload_job_and_cleanup keeps the uploaded file alive for the import thread, then cleans up.
    t = threading.Thread(name="import_fish_care", target=run_upload_job_and_cleanup,
                         args=(t_file_dir, import_fish_care_xlsx, t_file_dir.name, username, job_id),
                         daemon=True)
    t.start()
    return {"job_id": job_id}


@fish_care.route('/fish_care/sheets_preview', methods=(['POST']))
def sheets_preview():
    """Pull the configured Google Sheet and parse it WITHOUT writing. Stash the parsed snapshot
    in the shared job store and return a token + preview for the user to confirm."""
    username = maybe_get_username(request.headers, "fish care sheets preview")
    if isinstance(username, dict):
        return username
    try:
        config = get_species_config()
        sheet_id = os.getenv(config.fish_care_sheet_id_env)
        if not sheet_id:
            return {"error": f"No Google Sheet configured ({config.fish_care_sheet_id_env} not set)"}
        result = parse_workbook(google_sheets.read_spreadsheet(sheet_id), config)
    except Exception as e:  # noqa
        LOGGER.exception("Fish care sheets preview failed")
        return {"error": str(e)}

    token = str(uuid.uuid4())
    add_server_job(token)
    complete_job(token, JobState.Complete.name, {'parsed': result['parsed']})
    return {"token": token, "preview": build_preview(result)}


@fish_care.route('/fish_care/sheets_commit', methods=(['POST']))
def sheets_commit():
    """Persist a previously previewed snapshot (replace-per-sheet)."""
    username = maybe_get_username(request.headers, "fish care sheets commit")
    if isinstance(username, dict):
        return username
    token = (request.get_json(silent=True) or {}).get('token')
    if not token:
        return {"error": "Missing preview token"}
    state, snapshot = check_job(token)
    if state != JobState.Complete.name or not snapshot:
        return {"error": "Preview expired or not found; please sync again."}
    return persist_sheets(snapshot['parsed'], username, 'gsheet')
