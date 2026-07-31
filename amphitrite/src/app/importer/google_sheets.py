"""Google Sheets ingestion adapter.

Generic: reads a spreadsheet by id into the same `{sheet_name: (header, data_rows)}` shape the
xlsx adapter produces, so importer/import_fish_care.parse_workbook() is source-agnostic. Uses a
service account (the lab shares the sheet with its email). No species knowledge lives here — the
caller resolves the target Sheet ID from the species config.
"""
import json
import os

from amphi_logging.logger import get_logger

LOGGER = get_logger('importer')

SA_KEY_ENV = 'AMPHI_GOOGLE_SA_KEY'
_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']


def _get_service():
    # Imported lazily so the server (and non-sheets code paths) don't hard-require the Google libs.
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    raw = os.getenv(SA_KEY_ENV)
    if not raw:
        raise ValueError(f"{SA_KEY_ENV} not set; cannot connect to Google Sheets")
    if os.path.isfile(raw):
        creds = service_account.Credentials.from_service_account_file(raw, scopes=_SCOPES)
    else:
        creds = service_account.Credentials.from_service_account_info(json.loads(raw), scopes=_SCOPES)
    return build('sheets', 'v4', credentials=creds, cache_discovery=False)


def read_spreadsheet(sheet_id: str) -> dict:
    """Return {tab_title: (header, data_rows)} for every tab in the spreadsheet.

    The Sheets API omits trailing empty cells, so rows can be ragged; downstream parsing pads
    short rows with None, so no normalization is needed here beyond splitting header vs data.
    """
    service = _get_service()
    meta = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
    sheets = {}
    for tab in meta.get('sheets', []):
        title = tab['properties']['title']
        response = service.spreadsheets().values().get(
            spreadsheetId=sheet_id, range=title).execute()
        values = response.get('values', [])
        if not values:
            continue
        header = [str(c).strip() for c in values[0]]
        sheets[title] = (header, [list(r) for r in values[1:]])
    return sheets
