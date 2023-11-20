import csv
import os
import uuid
from datetime import datetime
from enum import Enum

from amphi_logging.logger import get_logger
from db_utils.insert import InsertTableData, batch_insert_records
from exceptions.exceptions import BadFishDataDuplicateTag, BadFishDataTagFormatWrong
from utils.server_state import complete_job, JobState

LOGGER = get_logger('importer')


class MasterDataCols(Enum):
    Notes = 0
    Id = 1
    Sex = 2
    Family_Id = 3
    Box = 4
    ALLELE_1 = 5
    ALLELE_N = 154


def import_master_data(t_file_dir, username, job_id):  # birthyear can be parsed from file
    year = datetime.today().year

    refuge_tags = {}
    fishes = []
    families = {}
    genes = []
    notes = {}  # TODO

    try:
        header = ""
        with open(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), mode='r', encoding='UTF-8') as master_data:
            try:
                csv_lines = csv.reader(master_data)
                header = next(csv_lines, None)
                # Check that we actually have a master sheet by looking for correct column header
                if not (header[MasterDataCols.ALLELE_1.value] == 'Htr-GVL-001_0'):
                    raise Exception("Not a valid master sheet")

            except: # noqa
                LOGGER.error(f"Data for master sheet upload is not in valid CSV format. Header of submitted file: {header}")
                return {"error": "Data for master sheet upload is not in valid CSV format."}

            for line in csv.reader(master_data):
                refuge_tag = line[MasterDataCols.Id.value]
                if refuge_tag in refuge_tags:
                    raise BadFishDataDuplicateTag(refuge_tag)
                elif refuge_tag == '':
                    LOGGER.warning("Line found with empty refuge tag, skipping")
                    continue

                csv_fam_id = line[MasterDataCols.Family_Id.value]
                sibling_birth_year, refuge_tag, group_id = _maybe_correct_for_2_year_olds(year, refuge_tag, csv_fam_id)

                if len(refuge_tag) > 6:
                    if len(refuge_tag) > 12:
                        raise BadFishDataTagFormatWrong(refuge_tag)
                    else:
                        LOGGER.warning(f"Nonstandard tag was found: '{refuge_tag}'. Hopefully this fish is dead.")
                        # TODO Mark as do not cross and a note

                fish_id = str(uuid.uuid4())
                family_id = str(uuid.uuid4())
                if group_id == -1:
                    LOGGER.warning(f"Invalid family group_id: '{line[MasterDataCols.Family_Id.value]}' for: {refuge_tag}. "
                                   f"Fish record will be created with null family.")
                    family_id = "\\N"
                elif csv_fam_id not in families:
                    families[csv_fam_id] = {"sibling_birth_year": sibling_birth_year,
                                            # MasterDataCols.Family_Id is prepended with 2_ when it's a previous years fish
                                            "group_id": group_id,
                                            "id": family_id,
                                            "tag_temp": refuge_tag,
                                            "sibling_birth_year_temp": sibling_birth_year}
                else:
                    family_id = families[csv_fam_id]["id"]

                try:
                    fish_box = int(line[MasterDataCols.Box.value])
                except Exception: # noqa:
                    fish_box = "\\N"

                fish = {"sex": line[MasterDataCols.Sex.value].upper(),
                        "box": fish_box,
                        "family": family_id,
                        "id": fish_id,
                        "tag_temp": refuge_tag,
                        "sibling_birth_year_temp": sibling_birth_year}
                if not(fish['sex'] == 'M' or fish['sex'] == 'F'):
                    fish['sex'] = 'UNKNOWN'
                fishes.append(fish)

                refuge_tags[line[MasterDataCols.Id.value]] = {"tag": refuge_tag,
                                                              "fish": fish_id,
                                                              "id": str(uuid.uuid4()),
                                                              "tag_temp": refuge_tag,
                                                              "sibling_birth_year_temp": sibling_birth_year}

                for allele_idx, col in enumerate(range(MasterDataCols.ALLELE_1.value, MasterDataCols.ALLELE_N.value, 2)):
                    genes.append({"name": f"Htr-GVL-00{allele_idx + 1}",
                                  "allele_1": line[col],
                                  "allele_2": line[col+1],
                                  "fish": fish_id,
                                  "id": str(uuid.uuid4()),
                                  "tag_temp": refuge_tag,
                                  "sibling_birth_year_temp": sibling_birth_year})

            gene_table_data = InsertTableData('gene', genes)
            gene_table_data.set_constraint_action("ON CONFLICT (name, fish) DO UPDATE SET (allele_1, allele_2) = "
                                                  "(EXCLUDED.allele_1, EXCLUDED.allele_2)")
            gene_table_data.set_temp_table_update("""UPDATE gene_insert as gi SET (fish, sibling_birth_year_temp) = (
                                                     SELECT fi.id, 0)
                                                       FROM fish fi
                                                       JOIN refuge_tag rt ON fi.id = rt.fish
                                                  LEFT JOIN family fam ON fam.id = fi.family
                                                      WHERE gi.tag_temp = rt.tag
                                                        AND (fam.sibling_birth_year = gi.sibling_birth_year_temp
                                                            OR fam.id IS NULL)""")

            table_data = [InsertTableData('fish', fishes),
                          InsertTableData('family', list(families.values())),
                          InsertTableData('refuge_tag', list(refuge_tags.values())),
                          gene_table_data]

        insert_result = batch_insert_records(table_data, username)
        if 'error' in insert_result:
            complete_job(job_id, JobState.Failed, insert_result)
        else:
            complete_job(job_id, JobState.Complete, insert_result)
    except Exception as any:
        LOGGER.error(f"Completing job-id failure {job_id}")
        complete_job(job_id, JobState.Failed, {"error": str(any)})


def _maybe_correct_for_2_year_olds(year, refuge_tag, csv_fam_id):
    sibling_birth_year = year
    if refuge_tag[0] == '2':
        sibling_birth_year = year - 1  # This is a 2-year-old
        refuge_tag = refuge_tag[2:]
        csv_fam_id = csv_fam_id[2:]

    try:
        csv_fam_id = int(csv_fam_id)
    except ValueError:
        csv_fam_id = -1

    return sibling_birth_year, refuge_tag, csv_fam_id


def get_birthyear_from_master_filename(filename: str):
    return int(filename[0:4])
