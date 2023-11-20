def _parse_year_from_filename(filename):
    """
    Parses the year from the filename
    Expected filename format: <data_type>_YYYYMMdd.csv

    :param filename:
    :return: The year as an int
    """
    start_year_idx = filename.rfind("_") + 1
    return int(filename[start_year_idx:start_year_idx+4])
