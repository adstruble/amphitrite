import csv
import os
import re
import uuid
from datetime import date

from amphi_logging.logger import get_logger
from db_utils.insert import InsertTableData, batch_insert_cross_data
from exceptions.exceptions import UploadCrossesError
from importer.import_utils import maybe_correct_for_2_year_olds
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


def import_crosses(t_file_dir, username, job_id):
    try:
        header = ""
        with open(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), mode='r', encoding='UTF-8') as rec_crosses:
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
            for line_num, line in enumerate(csv.reader(rec_crosses)):
                date_str = ""
                try:
                    date_str = line[RecCrossesDataCols.Date]
                    cross_date = _handle_date_str(date_str)
                    parent_1_birth_year, parent_1_tag, _ = maybe_correct_for_2_year_olds(
                        cross_date.year - 1, line[RecCrossesDataCols.Female])
                    parent_2_birth_year, parent_2_tag, _ = maybe_correct_for_2_year_olds(
                        cross_date.year - 1, line[RecCrossesDataCols.Male])
                    temp_parent_2_id = uuid.uuid4()
                    temp_parent_1_id = uuid.uuid4()
                    families.append({'id': str(uuid.uuid4()),
                                     'parent_1_tag_temp': parent_1_tag,
                                     'parent_2_tag_temp': parent_2_tag,
                                     'parent_1_birth_year_temp': parent_1_birth_year.year,
                                     'parent_2_birth_year_temp': parent_2_birth_year.year,
                                     'parent_1_temp': temp_parent_1_id,  # Should exist in db, but will insert if not
                                     'parent_2_temp': temp_parent_2_id,  # Should exist in db, but will insert if not
                                     'parent_1': temp_parent_1_id,
                                     'parent_2': temp_parent_2_id,
                                     'cross_date': cross_date,
                                     'group_id': line[RecCrossesDataCols.SFG]})

                except Exception as e: # noqa
                    LOGGER.exception(f'Error processing date: "{date_str}" '
                                     f'while importing crosses. Skipping cross line: {line_num}', e)
            insert_result = batch_insert_cross_data(InsertTableData('family', families), username)

        if 'error' in insert_result:
            complete_job(job_id, JobState.Failed, insert_result)
        else:
            complete_job(job_id, JobState.Complete, insert_result)
    except Exception as any_e:
        LOGGER.exception(f"Failed import cross job: {job_id}")
        complete_job(job_id, JobState.Failed, {"error": str(any_e)})


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
        with open(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), mode='r', encoding='UTF-8') as rec_crosses:
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
