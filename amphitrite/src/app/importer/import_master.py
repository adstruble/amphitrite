import csv
import os
import uuid
from datetime import date
from enum import Enum

from amphi_logging.logger import get_logger
from db_utils.insert import InsertTableData, batch_insert_master_data
from exceptions.exceptions import BadFishDataDuplicateTag, BadFishDataTagFormatWrong
from importer.import_utils import _parse_year_from_filename
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


def import_master_data(t_file_dir, username, job_id, filename):
    year = _parse_year_from_filename(filename)

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
                sibling_birth_year, refuge_tag, group_id = _maybe_correct_for_2_year_olds(year - 1, refuge_tag, csv_fam_id)

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
                                   f"Fish record will be created with default family.")
                if str(group_id) + str(sibling_birth_year.year) not in families:
                    families[str(group_id) + str(sibling_birth_year.year)] = {
                        "cross_date": sibling_birth_year,
                        "group_id": group_id,
                        "id": family_id,
                        "tag_temp": refuge_tag,
                        "sibling_birth_year_temp": sibling_birth_year}
                else:
                    family_id = families[str(group_id) + str(sibling_birth_year.year)]["id"]

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
            gene_table_data.set_insert_condition("ON CONFLICT (name, fish) DO UPDATE SET (allele_1, allele_2) = "
                                                 "(EXCLUDED.allele_1, EXCLUDED.allele_2)")
            # We update the timestamp of the birth year temp so that an attempt to insert the genes will always
            # happen and instead the gene will be updated if there is a conflict on insertion
            gene_table_data.add_temp_table_update("""UPDATE gene_insert as gi SET (fish) = (
                                                     SELECT fi.id)
                                                       FROM fish fi
                                                       JOIN refuge_tag rt ON fi.id = rt.fish
                                                  LEFT JOIN family fam ON fam.id = fi.family
                                                      WHERE gi.tag_temp = rt.tag
                                                        AND (fam.cross_date = gi.sibling_birth_year_temp
                                                            OR fam.id IS NULL)""")

            family_table_date = InsertTableData('family', list(families.values()))
            family_table_date.set_insert_condition("ON CONFLICT ON CONSTRAINT unique_family_no_parents DO NOTHING")
            family_table_date.add_temp_table_update('ALTER TABLE family_insert drop column cross_year')
            family_table_date.add_temp_table_update('ALTER TABLE family_insert ADD COLUMN cross_year numeric '
                                                    'GENERATED ALWAYS AS (extract(year from cross_date)) STORED')
            fish_table_data = InsertTableData('fish', fishes)
            fish_table_data.add_temp_table_update("""UPDATE fish_insert f_i SET (family) = (
                                                     SELECT COALESCE(fa.id, fa_i.id) FROM family_insert as fa_i
                                                     LEFT JOIN family as fa on fa.cross_year = fa_i.cross_year
                                                     AND fa_i.group_id = fa.group_id
                                                     WHERE f_i.family = fa_i.id)""")
            fish_table_data.set_insert_condition("""WHERE NOT EXISTS (
                                                    SELECT 1
                                                    FROM refuge_tag as rt
                                                    JOIN fish ON rt.fish = fish.id
                                                    JOIN family ON family.id = fish.family
                                                        WHERE fish_insert.tag_temp = rt.tag
                                                        AND fish_insert.sibling_birth_year_temp = family.cross_date)
            """)
            refuge_tag_data = InsertTableData('refuge_tag', list(refuge_tags.values()))
            refuge_tag_data.set_insert_condition("""WHERE NOT EXISTS (
                                                    SELECT 1
                                                    FROM refuge_tag as rt
                                                    JOIN fish ON rt.fish = fish.id
                                                    JOIN family ON family.id = fish.family
                                                      WHERE refuge_tag_insert.tag_temp = rt.tag
                                                      AND refuge_tag_insert.sibling_birth_year_temp = family.cross_date)
            """)
            table_data = [family_table_date,
                          fish_table_data,
                          refuge_tag_data,
                          gene_table_data]

        insert_result = batch_insert_master_data(table_data, username)
        if 'error' in insert_result:
            complete_job(job_id, JobState.Failed, insert_result)
        else:
            complete_job(job_id, JobState.Complete, insert_result)
    except Exception as any_e:
        LOGGER.exception(f"Failed {job_id} importing master data.", any_e)
        complete_job(job_id, JobState.Failed, {"error": str(any_e)})


def _maybe_correct_for_2_year_olds(sibling_birth_year_int, refuge_tag, csv_fam_id):
    """

    :param sibling_birth_year_int: The year this fish was born (and its sibling) as an int
    :param refuge_tag:
    :param csv_fam_id:
    :return:
    """
    sibling_birth_year = date(sibling_birth_year_int, 1, 1)
    if refuge_tag[0] == '2':
        LOGGER.warning(f"Correcting for 2 year old:{refuge_tag} {sibling_birth_year_int} {csv_fam_id}")
        sibling_birth_year = date(sibling_birth_year_int - 1, 1, 1)  # This is a 2-year-old
        refuge_tag = refuge_tag[1:]
        # MasterDataCols.Family_Id is sometimes prepended with 2_ when it's a previous years fish
        csv_fam_id = csv_fam_id[2:] if csv_fam_id.startswith('2_') else csv_fam_id

    try:
        csv_fam_id = int(csv_fam_id)
    except ValueError:
        csv_fam_id = -1

    return sibling_birth_year, refuge_tag, csv_fam_id


def get_birthyear_from_master_filename(filename: str):
    return int(filename[0:4])
