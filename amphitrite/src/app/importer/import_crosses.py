import csv
import datetime
import os
import re
import uuid
from datetime import date

from algorithms.f_calculation import build_matrix_from_existing
from amphi_logging.logger import get_logger
from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS, make_connection_kwargs
from db_utils.insert import insert_table_data
from exceptions.exceptions import UploadCrossesError
from importer.import_utils import maybe_correct_for_2_year_olds
from model.family import get_ids_and_di_for_tag
from utils.server_state import complete_job, JobState

LOGGER = get_logger('importer')


class RecCrossesDataCols(object):
    Date = 0
    Male = 1
    Female = 3
    Male_Sibling_Group = 2
    Female_Sibling_Group = 4
    SFG = 7
    MFG = 6


def import_crosses(crosses_file, username, job_id, year=datetime.datetime.now().year):

    try:
        header = ""
        with open(crosses_file, mode='r', encoding='utf-8-sig') as rec_crosses:
            f_matrix = build_matrix_from_existing(username, year)
            try:
                csv_lines = csv.reader(rec_crosses)
                header = next(csv_lines, None)
                # Check that we actually have recommended crosses by looking for correct column headers
                correct_fields = []
                sfg_re = re.compile('^BY.*FSG.*$')
                for col_idx, col_name in enumerate(header):
                    if col_name == 'Date':
                        RecCrossesDataCols.Date = col_idx
                        correct_fields.append('Date')
                    elif col_name == 'Male':
                        RecCrossesDataCols.Male = col_idx
                        correct_fields.append('Male')
                    elif col_name == 'Female':
                        RecCrossesDataCols.Female = col_idx
                        correct_fields.append('Female')
                    elif sfg_re.match(col_name):
                        RecCrossesDataCols.SFG = col_idx
                        correct_fields.append('SFG')
                if len(correct_fields) != 4:
                    raise UploadCrossesError.bad_csv_format(correct_fields)
            except UploadCrossesError as upload_e:
                raise upload_e
            except Exception as any_e: # noqa
                raise UploadCrossesError({any_e}) from any_e

            families = []
            requested_crosses = []
            for line_num, line in enumerate(csv.reader(rec_crosses)):
                date_str = ""
                try:
                    date_str = line[RecCrossesDataCols.Date]
                    try:
                        cross_date = _handle_date_str(date_str)
                    except: # noqa
                        complete_job(job_id, JobState.Failed.name, {"error": f"Failure parsing date for row: {line_num}"})

                    parent_1_birth_date, parent_1_tag, _ = maybe_correct_for_2_year_olds(
                        cross_date.year - 1, line[RecCrossesDataCols.Female])
                    parent_2_birth_date, parent_2_tag, _ = maybe_correct_for_2_year_olds(
                        cross_date.year - 1, line[RecCrossesDataCols.Male])
                    group_id = line[RecCrossesDataCols.SFG]
                    if not group_id:
                        complete_job(job_id, JobState.Failed.name, {"error": f"Group ID missing for row: {line_num}"})
                        return

                    try:
                        parent_1 = get_ids_and_di_for_tag(parent_1_tag, parent_1_birth_date.year, username)[0]
                    except IndexError:
                        handle_missing_parent_tag(parent_1_tag, job_id)
                        return
                    try:
                        parent_2 = get_ids_and_di_for_tag(parent_2_tag, parent_2_birth_date.year, username)[0]
                    except IndexError:
                        handle_missing_parent_tag(parent_2_tag, job_id)
                        return

                    di = (parent_1['di'] + parent_2['di']) / 2 + 1
                    f = f_matrix.calculate_f_for_potential_cross(parent_1['family'], parent_2['family'])

                    LOGGER.info(f"Calculated f {f}, for families 1 {parent_1['family']}, 2: {parent_2['family']}"
                                f" tag1 {parent_1_tag}, tag2 {parent_2_tag}")
                    families.append({'id': str(uuid.uuid4()),
                                     'parent_1': parent_1['animal'],
                                     'parent_2': parent_2['animal'],
                                     'cross_date': cross_date,
                                     'group_id': line[RecCrossesDataCols.SFG],
                                     'mfg': '\\N' if not line[RecCrossesDataCols.MFG] else line[RecCrossesDataCols.MFG],
                                     'f': f,
                                     'di': di})
                    requested_crosses.append({
                        'id': str(uuid.uuid4()),
                        'parent_f': parent_1['animal'],
                        'parent_m': parent_2['animal'],
                        'parent_f_fam': parent_1['family'],
                        'parent_m_fam': parent_2['family'],
                        'cross_date': cross_date,
                        'f': f
                    })
                except Exception as e: # noqa
                    LOGGER.exception(f'Error processing date: "{date_str}" '
                                     f'while importing crosses. Skipping cross line: {line_num}', e)

        with get_connection(**make_connection_kwargs(DEFAULT_DB_PARAMS, username=username)) as conn:
            with conn.connection.cursor() as cursor:
                family_inserts, family_updates = insert_table_data(
                    'family', families, cursor,'ON CONFLICT (parent_1, parent_2, cross_year)'
                                               ' DO UPDATE SET(cross_date, group_id, mfg) = (EXCLUDED.cross_date,'
                                               'EXCLUDED.group_id, EXCLUDED.mfg)')
                LOGGER.info(f"{family_inserts} crosses from {cross_date.year} inserted.")
                rc_inserts, rc_updates = insert_table_data(
                    'requested_cross', requested_crosses, cursor,
                    'ON CONFLICT (parent_f_fam, parent_m_fam, supplementation) DO UPDATE SET '
                    '(cross_date, parent_f, parent_m) = (EXCLUDED.cross_date, EXCLUDED.parent_f, EXCLUDED.parent_m)')
                LOGGER.info(f"{rc_inserts} requested_crosses from {cross_date.year} inserted.")
                complete_job(job_id, JobState.Complete.name, {"success": {'inserts': {'Family': family_inserts,
                                                                                 'Requested Cross': rc_inserts},
                                                                     'updates': {'Family': family_updates,
                                                                                 'Requested Cross': rc_updates}}})

    except Exception as any_e:
        LOGGER.exception(f"Failed import cross job: {any_e}")
        complete_job(job_id, JobState.Failed.name, {"error": str(any_e)})


def handle_missing_parent_tag(parent, job_id):
    LOGGER.error("Parent tag from upload crosses file was not found")
    complete_job(job_id, JobState.Failed.name, {"error": f"Parent tag: {parent} from upload crosses file was not found"})


def _handle_date_str(date_str):
    try:
        date_split = date_str.split('/')
        cross_year = int(date_split[2])
        cross_month = int(date_split[0])
        cross_day = int(date_split[1])
        cross_date = date(cross_year, cross_month, cross_day)
        return cross_date
    except Exception as e:
        raise e


def count_sibling_groups(t_file_dir, job_id):

    sibling_groups = set()
    try:
        header = ""
        with open(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), mode='r', encoding='utf-8-sig') as rec_crosses:
            try:
                csv_lines = csv.reader(rec_crosses)
                header = next(csv_lines, None)
                # Check that we actually have recommended crosses by looking for correct column header
                if not (header[RecCrossesDataCols.Date] == 'Date' and
                        header[RecCrossesDataCols.Male] == 'Male' and
                        header[RecCrossesDataCols.Female] == 'Female' and
                        header[RecCrossesDataCols.MFG].startswith('MFG') ):
                    raise Exception("Not a valid recommended crosses sheet")

            except: # noqa
                LOGGER.error(f"Data for recommended crosses sheet upload is not in valid CSV format. "
                             f"Header of submitted file: {header}")
                return {"error": "Data for recommended crosses sheet upload is not in valid CSV format."}

            for line in csv.reader(rec_crosses):
                sibling_groups.add(line[RecCrossesDataCols.Male_Sibling_Group])
                sibling_groups.add(line[RecCrossesDataCols.Female_Sibling_Group])
            LOGGER.info(f"{len(sibling_groups)} unique sibling groups")
    except Exception as e:
        LOGGER.exception("Oops! ")
