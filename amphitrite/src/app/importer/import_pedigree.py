import csv
import os
import uuid
from datetime import date
from enum import Enum

from amphi_logging.logger import get_logger
from exceptions.exceptions import WildTypeCrossedMultipleTimes


class PedigreeDataCols(Enum):
    GROUP_ID = 0
    PARENT_1 = 1
    PARENT_2 = 2


LOGGER = get_logger('importer')


def import_master_data(t_file_dir, username, job_id, filename):
    try:
        header = ""
        families = {}
        family_pedigrees = []
        wt_fish = {}
        with open(os.path.join(t_file_dir.name, f'bulk_upload_{job_id}'), mode='r', encoding='UTF-8') as pedigree_data:
            for line in csv.reader(pedigree_data):
                group_id_unparsed = line[PedigreeDataCols.GROUP_ID.value]
                if len(group_id_unparsed) < 6:
                    # WT Fish, add it.
                    wt_fish[int(group_id_unparsed)] = {'wt': True,
                                                       'sex': 'UNKNOWN',
                                                       'alive': False,
                                                       'id': str(uuid.uuid4()),
                                                       'cross_cnt': 0}
                    continue
                elif group_id_unparsed[5] == "1":  # Each child fam gets 2 lines,
                    # one for the male and one for the female, only add the family once
                    generation_int = int(group_id_unparsed[0:2])
                    if generation_int % 10 == 0:
                        # first 9 generations start with "<generation num>0"
                        cross_date = date(int(generation_int / 10) + 2007, 1, 1)
                    else:
                        # Generations after gen 9 start with 1 and skip the "<generation num>0" numbers
                        cross_date = date(generation_int + 2006, 1, 1)
                    families[group_id_unparsed] = {'group_id': int(group_id_unparsed[2:5]),
                                                   'cross_date': cross_date,
                                                   'id': str(uuid.uuid4())}

                parent_1 = line[PedigreeDataCols.PARENT_1.value]
                parent_2 = line[PedigreeDataCols.PARENT_2.value]
                if len(parent_1) < 6 and len(parent_2) < 6:
                    maybe_ignore_wt_cross(int(parent_1), int(parent_2), wt_fish)
                    continue

                # We have at least one bred fish as a parent, so start needing to keep track
                if parent_1 in families:
                    family_pedigrees.append({'id': str(uuid.uuid4()),
                                             'parent': families[parent_1]['id'],
                                             'child': families[group_id_unparsed]})
                if parent_2 in families:
                    family_pedigrees.append({'id': str(uuid.uuid4()),
                                             'parent': families[parent_2]['id'],
                                             'child': families[group_id_unparsed]})
                TODO UPDATE THE DI AND FA of the child families if possible

    except Exception as any_e:
        LOGGER.exception(f"Failed importing pedigree data.", any_e)


def maybe_ignore_wt_cross(parent_1, parent_2, wt_fish):
    # Cross of 2 wts so we only care if it's been crossed more than once. Since I don't know if that
    # happened just throwing an exception in that case for now
    if wt_fish[int(parent_1)]['cross_cnt'] > 0:
        raise WildTypeCrossedMultipleTimes(parent_1)
    wt_fish[int(parent_1)]['cross_cnt'] = 1
    if wt_fish[int(parent_2)]['cross_cnt'] > 0:
        raise WildTypeCrossedMultipleTimes(parent_2)
    wt_fish[int(parent_2)]['cross_cnt'] = 1