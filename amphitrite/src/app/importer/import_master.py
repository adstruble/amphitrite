import csv
import time
import uuid
from datetime import datetime
from enum import Enum

from amphi_logging.logger import get_logger
from db_utils.insert import InsertTableData, batch_insert_records
from exceptions.exceptions import BadFishDataDuplicateTag, BadFishDataTagFormatWrong

LOGGER = get_logger('importer')


class MasterDataCols(Enum):
    Notes = 0
    Id = 1
    Sex = 2
    Family_Id = 3
    Box = 4
    ALLELE_1 = 5
    ALLELE_N = 154


def import_master_data(data, username):  # birthyear can be parsed from file
    year = datetime.today().year

    refuge_tags = {}
    fishes = []
    families = {}
    genes = []
    notes = {}  # TODO

    csv_lines = csv.reader(data)
    next(csv_lines, None)
    for line in csv.reader(data):
        refuge_tag = line[MasterDataCols.Id.value]
        if refuge_tag in refuge_tags:
            raise BadFishDataDuplicateTag(refuge_tag)
        elif refuge_tag == '':
            LOGGER.warning("Line found with empty refuge tag, skipping")
            continue

        csv_fam_id = line[MasterDataCols.Family_Id.value]
        sibling_birth_year, refuge_tag, group_id = _maybe_correct_for_2_year_olds(year, refuge_tag, csv_fam_id)

        if len(refuge_tag) > 6:
            raise BadFishDataTagFormatWrong(refuge_tag)

        fish_id = str(uuid.uuid4())
        family_id = str(uuid.uuid4())
        if group_id == -1:
            LOGGER.warning(f"Invalid family group_id: '{line[MasterDataCols.Family_Id.value]}' for: {refuge_tag}. "
                           f"Fish record will be created with null family.")
            family_id = "\\N"
        elif csv_fam_id not in families:
            families[csv_fam_id] = {"sibling_birth_year": sibling_birth_year,
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

    batch_insert_records(table_data, username)


def _maybe_correct_for_2_year_olds(year, refuge_tag, csv_fam_id):
    sibling_birth_year = year
    if refuge_tag[0] == '2':
        sibling_birth_year = year - 1  # This is a 2-year-old
        # MasterDataCols.Family_Id and MasterDataCols.refuge_tag are prepended with 2_ when it's a previous years fish
        refuge_tag = refuge_tag[2:]
        csv_fam_id = csv_fam_id[2:]

    try:
        csv_fam_id = int(csv_fam_id)
    except ValueError:
        csv_fam_id = -1

    return sibling_birth_year, refuge_tag, csv_fam_id


def get_birthyear_from_master_filename(filename: str):
    return int(filename[0:4])
