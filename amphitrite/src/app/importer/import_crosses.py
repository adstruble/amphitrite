import csv
import os
from enum import Enum

from amphi_logging.logger import get_logger
from utils.server_state import complete_job, JobState

LOGGER = get_logger('importer')


class RecCrossesDataCols(Enum):
    Date = 0
    Male = 1
    Male_Sibling_Group = 2
    Female = 3
    Child_Sibling_Group = 4
    Female_Sibling_Group = 5
    MFG = 6
    Comment = 7


def count_sibling_groups(t_file_dir, job_id):

    sibling_groups = set()
    try:
        header = ""
        with open(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), mode='r', encoding='UTF-8') as rec_crosses:
            try:
                csv_lines = csv.reader(rec_crosses)
                header = next(csv_lines, None)
                # Check that we actually have recommended crosses by looking for correct column header
                if not (header[RecCrossesDataCols.Date.value] == 'Date' and
                        header[RecCrossesDataCols.Male.value] == 'Male' and
                        header[RecCrossesDataCols.Female.value] == 'Female' and
                        header[RecCrossesDataCols.MFG.value].startswith('MFG BY') ):
                    raise Exception("Not a valid recommended crosses sheet")

            except: # noqa
                LOGGER.error(f"Data for recommended crosses sheet upload is not in valid CSV format. "
                             f"Header of submitted file: {header}")
                return {"error": "Data for recommended crosses sheet upload is not in valid CSV format."}

            for line in csv.reader(rec_crosses):
                sibling_groups.add(line[RecCrossesDataCols.Male_Sibling_Group.value])
                sibling_groups.add(line[RecCrossesDataCols.Female_Sibling_Group.value])
            LOGGER.info(f"{len(sibling_groups)} unique sibling groups")
    except Exception as e:
        LOGGER.exception("Oops! ", e)


def determine_parents_for_backup_tanks(t_file_dir, job_id):

    tanks = dict()  # MFGs to include (tank #) : [sibling groups]
    tanks_included = set()
    sibling_groups_included = set()
    try:
        header = ""
        with open(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), mode='r', encoding='UTF-8') as rec_crosses:
            try:
                csv_lines = csv.reader(rec_crosses)
                header = next(csv_lines, None)
                # Check that we actually have recommended crosses by looking for correct column header
                if not (header[RecCrossesDataCols.Date.value] == 'Date' and
                        header[RecCrossesDataCols.Male.value] == 'Male' and
                        header[RecCrossesDataCols.Female.value] == 'Female' and
                        header[RecCrossesDataCols.MFG.value].startswith('MFG BY') ):
                    raise Exception("Not a valid recommended crosses sheet")

            except: # noqa
                LOGGER.error(f"Data for recommended crosses sheet upload is not in valid CSV format. "
                             f"Header of submitted file: {header}")
                return {"error": "Data for recommended crosses sheet upload is not in valid CSV format."}

            for line in csv.reader(rec_crosses):
                mfg = line[RecCrossesDataCols.MFG.value]
                tanks.setdefault(mfg, set())
                tanks[mfg].add(line[RecCrossesDataCols.Male_Sibling_Group.value])
                tanks[mfg].add(line[RecCrossesDataCols.Female_Sibling_Group.value])

        tank_keys = list(tanks.keys())
        tank_keys.sort()

        print(tank_keys)
        add_sibling_group(tanks, tank_keys, tanks_included=set(), sibling_groups_included=set())
        LOGGER.info(tanks_included)

    except Exception as any:
        LOGGER.error(f"Completing import recommended crosses job failure", any)

        #add_sibling_group(tanks, tank_keys, tanks_included=set(), sibling_groups_included=set())


sibling_group_included_final = set()
tanks_included_final = set()
num_permutations = 0


def add_sibling_group(tanks, tank_keys, tanks_included, sibling_groups_included):
    global sibling_group_included_final
    global tanks_included_final
    global num_permutations

    for i in range(len(tank_keys)):
        if len(tanks_included) == 23:
            num_permutations = num_permutations + 1
            if num_permutations % 10000000 == 0:
                LOGGER.info(f"Completed {num_permutations}")
            tank_set = {tank_keys[i]}
            sibling_group = tanks[tank_keys[i]]
            next_sibling_groups_included = sibling_groups_included.union(sibling_group)
            next_tanks_included = tanks_included.union(tank_set)
            if len(next_sibling_groups_included) > len(sibling_group_included_final):
                LOGGER.info(f"new sibling group found with sibling count = {len(next_sibling_groups_included)}")
                sibling_group_included_final = next_sibling_groups_included
                tanks_included_final = next_tanks_included
                LOGGER.info(f"tanks to include: {tanks_included_final}")
        else:
            next_tank_set = {tank_keys[i]}
            next_sibling_group = tanks[tank_keys[i]]
            add_sibling_group(tanks, tank_keys[i+1:], tanks_included.union(next_tank_set),
                              sibling_groups_included.union(next_sibling_group))



### RESULTS
### new sibling group found with sibling count = 286
### tanks to include: {'11', '15', '2', '16', '14', '17', '4', '13', '5', '10', '1', '18', '24', '19', '29', '37', '34', '22', '27', '12', '20', '7', '21', '36', '9'}
### new sibling group found with sibling count = 287
### tanks to include: {'11', '15', '17', '16', '14', '36', '4', '13', '5', '10', '32', '1', '18', '24', '19', '29', '34', '22', '27', '12', '20', '21', '23', '3', '9'}
###new sibling group found with sibling count = 289
### tanks to include: {'11', '15', '17', '16', '14', '36', '4', '13', '5', '10', '1', '18', '24', '19', '29', '37', '34', '8', '27', '12', '20', '7', '21', '23', '3'}
###2023-11-12 22:03:51,050 [    INFO] amphitrite.importer (import_crosses.py:100): new sibling group found with sibling count = 290
###2023-11-12 22:03:51,051 [    INFO] amphitrite.importer (import_crosses.py:103): tanks to include: {'27', '11', '23', '18', '37', '13', '34', '12', '29', '3', '20', '4', '36', '5', '10', '25', '38', '9', '24', '1', '14', '19', '17', '21', '15'}
###2023-11-13 05:39:26,065 [    INFO] amphitrite.importer (import_crosses.py:100): new sibling group found with sibling count = 291
###2023-11-13 05:39:26,065 [    INFO] amphitrite.importer (import_crosses.py:103): tanks to include: {'27', '11', '23', '7', '18', '34', '12', '29', '8', '3', '20', '4', '5', '10', '26', '25', '38', '24', '1', '32', '14', '19', '17', '21', '15'}