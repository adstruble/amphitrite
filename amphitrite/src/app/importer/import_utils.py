import os
from datetime import date

from amphi_logging.logger import get_logger

LOGGER = get_logger('importer')


def get_import_resources_dir():
    return os.path.join(os.path.abspath(os.path.dirname(__file__)), "resources")


def parse_year_from_filename(filename):
    """
    Parses the year from the filename
    Expected filename format: <data_type>_YYYYMMdd.csv

    :param filename:
    :return: The year as an int
    """
    start_year_idx = filename.rfind("_") + 1
    return int(filename[start_year_idx:start_year_idx+4])


def maybe_correct_for_2_year_olds(sibling_birth_year_int, refuge_tag, csv_fam_id='NONGIVEN'):
    """

    :param sibling_birth_year_int: The year this animal was born (and its sibling) as an int
    :param refuge_tag:
    :param csv_fam_id:
    :return:
    """

    # First update the refuge tag to remove the ending _1 or _2 because that can change (indicator of if it's M or F)
    refuge_tag = refuge_tag.split('_')[0]

    sibling_birth_year = date(sibling_birth_year_int, 1, 1)
    if refuge_tag[0] == '2':
        LOGGER.warning(f"Correcting for 2 year old:{refuge_tag} {sibling_birth_year_int} {csv_fam_id}")
        sibling_birth_year = date(sibling_birth_year_int - 1, 1, 1)  # This is a 2-year-old
        # Sometimes 2 year refuge tags start with 2_ sometimes just 2, normalize to 2
        if refuge_tag[1] == '_':
            refuge_tag = '2' + refuge_tag[2:]
        # MasterDataCols.Family_Id is sometimes prepended with 2_ when it's a previous years animal, remove it
        csv_fam_id = csv_fam_id[2:] if csv_fam_id.startswith('2_') else csv_fam_id

    try:
        csv_fam_id = int(csv_fam_id)
    except ValueError:
        if len(csv_fam_id) == 0:
            return sibling_birth_year, refuge_tag, None
        csv_fam_id = -1

    return sibling_birth_year, refuge_tag, csv_fam_id
