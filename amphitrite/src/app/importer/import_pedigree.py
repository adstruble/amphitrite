import csv
import os.path
import uuid
from datetime import date
from enum import Enum

from amphi_logging.logger import get_logger
from algorithms.f_calculation import FMatrix
from db_utils.core import execute_statements
from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS
from db_utils.insert import insert_table_data
from exceptions.exceptions import WildTypeCrossedWithRefugeInWild

from utils.data_conversions import get_group_id_from_parent


class PedigreeDataCols(Enum):
    GROUP_ID = 0
    PARENT_1 = 1
    PARENT_2 = 2


class FDataCols(Enum):
    CROSS_YEAR = 0
    GROUP_ID = 1
    F_VAL = 2


LOGGER = get_logger('importer')


class PedigreeImportState:
    # Mapping of the child_family_uuid to the family dict
    families = {}
    # Mapping of the child_uuid to a list of 2 pedigree objects, one representing the XX parent and
    # child and one representing the YY parent and child
    pedigrees = {}

    # gen_id : animal object
    bred_animal = {}

    # animal's family group_id: wt animal
    wt_animal = {}
    wt_animal_unbred = {}

    # Mapping of the unparsed (full string) generational fish ID in the pedigree input data to the animal's family UUID
    gen_id_unparsed_to_uuid = {}  #

    # Mapping of {year:{group_id:fam_uuid}}
    group_id_to_fam_uuid_by_date = {}

    last_years_parents = []

    # Mapping of {cross_year:{group_id:f_value}}
    f_values = {}

    f_matrix = FMatrix()


def import_pedigree(pedigree_file_path=None):
    if pedigree_exists():
        LOGGER.info("Pedigree previously imported, skipping pedigree import.")
        return

    LOGGER.info("Beginning pedigree import.")
    if not pedigree_file_path:
        pedigree_file_path = os.path.join(os.path.abspath(os.path.dirname(__file__)),
                                          "resources",
                                          'pedigree_20231122.csv')

    ped_state = PedigreeImportState()

    parse_pedigree_file(ped_state, pedigree_file_path)

    ingest_pedigree_data(ped_state)


def pedigree_exists():
    return execute_statements(
        'SELECT count(id) FROM pedigree', 'amphiadmin').get_single_result()


def ingest_pedigree_data(ped_state):
    results = dict()
    try:
        with get_connection(DEFAULT_DB_PARAMS, 'amphiadmin') as conn:
            with conn.connection.cursor() as cursor:
                # Insert all the child family groups
                results['family'] = insert_table_data('family', list(ped_state.families.values()), cursor)

                # Insert the animal to animal table
                results['animal'] = insert_table_data('animal',
                                                      list(ped_state.wt_animal.values()) +
                                                      list(ped_state.bred_animal.values()), cursor)
                # Make a list of all pedigrees
                all_pedigrees = []
                for pedigrees in ped_state.pedigrees.values():
                    all_pedigrees.extend(pedigrees)
                results['pedigree'] = insert_table_data('pedigree', all_pedigrees, cursor)

                # FMatrix values (don't include results in import results as this data is only used internally)
                #start_row = 0
                #batch_size = 500
                #while start_row < len(ped_state.f_matrix.rows):
                #    row_dicts, val_dicts = ped_state.f_matrix.get_matrix_dicts(start_row, start_row + batch_size)
                #    insert_table_data('f_row_val', val_dicts, cursor)
                #    insert_table_data('f_matrix_row', row_dicts, cursor)
                #    start_row = start_row + batch_size

        LOGGER.info(f"Pedigree import results: {results}")
    except Exception as e:
        LOGGER.exception("Exception during pedigree import.")
        raise e


def parse_pedigree_file(ped_state, pedigree_file_path):
    try:
        with (open(pedigree_file_path, mode='r', encoding='UTF-8') as pedigree_data):
            for line_num, line in enumerate(csv.reader(pedigree_data)):
                if line_num % 1000 == 0:
                    LOGGER.info(f"Line: {line_num}: {line}")
                    print(f"LINE: {line_num}: {line}")
                group_id_unparsed, parent_1, parent_2 = _read_pedigree_values(line)
                if group_id_unparsed is None:
                    continue

                if len(group_id_unparsed) < 6:
                    # WT Fish, add it and the child family group it belongs to
                    group_id = (-int(group_id_unparsed)) - 10000
                    child_family_id = str(uuid.uuid4())
                    ped_state.wt_animal[group_id] = {'wt': True,
                                                     'sex': 'UNKNOWN',
                                                     'alive': False,
                                                     'id': str(uuid.uuid4()),
                                                     'family': child_family_id,
                                                     'gen_id': group_id_unparsed}
                    ped_state.wt_animal_unbred[group_id] = False
                    ped_state.gen_id_unparsed_to_uuid[group_id_unparsed] = child_family_id
                    # Parents are unknown for this WT animal
                    ped_state.families[child_family_id] = {'group_id': group_id,
                                                           'id': child_family_id,
                                                           'f': 0,
                                                           'di': 1,
                                                           'parent_1': '\\N',
                                                           'parent_2': '\\N'}
                    continue

                parent_1_fam_uuid = ped_state.gen_id_unparsed_to_uuid[parent_1]
                parent_2_fam_uuid = ped_state.gen_id_unparsed_to_uuid[parent_2]
                if len(parent_1) == 6:
                    generation_int = int(parent_1[0:2]) # Use parent if it's not wildtype, because the child
                    # might be a 2-year-old, in which case the cross year determine from _its_ genid would be wrong
                    if generation_int % 10 == 0:
                        generation_int = generation_int + 10
                    else:
                        generation_int = generation_int + 1
                else:
                    generation_int = int(group_id_unparsed[0:2])

                if generation_int % 10 == 0:
                    # first 9 generations start with "<generation num>0"
                    cross_year = date(int(generation_int / 10) + 2006, 1, 1)
                else:
                    # Generations after gen 9 start with 1 and skip the "<generation num>0" numbers
                    cross_year = date(generation_int + 2005, 1, 1)

                if len(parent_1) < 6:
                    if not len(parent_2) < 6:
                        raise WildTypeCrossedWithRefugeInWild(parent_1, parent_2)
                    try:
                        ped_state.wt_animal_unbred.pop(-int(parent_1) - 10000)
                    except KeyError:
                        pass
                    try:
                        ped_state.wt_animal_unbred.pop(-int(parent_2) - 10000)
                    except KeyError:
                        pass
                    group_id = -int(parent_1)  # Child's group ID
                    # We don't actually know the Family sibling group id when parents were wildtype.
                    # And will end up with dupe group_ids if we use a parent_id for both parent group_id and the
                    # parent's children group_id, so use the negative of the parent id for the parent's group_id.
                    # Following example illustrates the issue:
                    # 200012,100032,100031  200012 belongs to group_id = 3
                    # 200021,3,2  200021 would also be in group_id = 3, but it's not the same as the above group, so
                    # assign group_id of -3
                    group_id_parent_1 = (-int(f"{parent_1}")) - 10000
                    group_id_parent_2 = (-int(f"{parent_2}")) - 10000
                    parent_1_uuid = ped_state.wt_animal[group_id_parent_1]['id']
                    parent_2_uuid = ped_state.wt_animal[group_id_parent_2]['id']

                    parent_fsg_cross_date = date(cross_year.year - 1, 1, 1)
                    ped_state.families[parent_1_fam_uuid]['cross_date'] = parent_fsg_cross_date
                    ped_state.families[parent_2_fam_uuid]['cross_date'] = parent_fsg_cross_date
                    # Shouldn't need to store the following, but will do so for completeness
                    cross_date_gid_to_fam = ped_state.group_id_to_fam_uuid_by_date.setdefault(parent_fsg_cross_date, {})
                    cross_date_gid_to_fam[group_id_parent_1] = [parent_1_fam_uuid]
                    cross_date_gid_to_fam[group_id_parent_2] = [parent_2_fam_uuid]
                else:
                    # Normal case, parents are bred animals
                    group_id = get_group_id_from_parent(parent_1, cross_year.year)
                    parent_1_uuid = ped_state.bred_animal[parent_1]['id']
                    parent_2_uuid = ped_state.bred_animal[parent_2]['id']

                animal_id = str(uuid.uuid4())  # group_id_unparsed
                child_family_id = str(uuid.uuid4())  # f"{cross_year}_{group_id}"
                ped_state.bred_animal[group_id_unparsed] = {'wt': False,
                                                            'sex': 'UNKNOWN',
                                                            'alive': False,
                                                            'id': animal_id,
                                                            'family': child_family_id,
                                                            'gen_id': group_id_unparsed}

                cross_year_group_id_to_fam = ped_state.group_id_to_fam_uuid_by_date.setdefault(cross_year, {})

                ped_state.pedigrees[animal_id] = []
                for parent_uuid, parent_genid in ((parent_1_uuid, parent_1), (parent_2_uuid, parent_2)):
                    ped_state.pedigrees[animal_id].append(
                        {'id': str(uuid.uuid4()),
                         'parent': parent_uuid,
                         'child': animal_id})

                if group_id in cross_year_group_id_to_fam:
                    # It's possible the group is the same if parents are 2 year olds.
                    matching_fam = False
                    for fam_id in cross_year_group_id_to_fam[group_id]:
                        if parent_1_uuid == ped_state.families[fam_id]['parent_1'] and\
                         parent_2_uuid == ped_state.families[fam_id]['parent_2']:
                            # We've already handled f, di calculations of this Family sibling group and
                            # created a record to be added to database for the FSG, so continue
                            ped_state.gen_id_unparsed_to_uuid[group_id_unparsed] = fam_id
                            ped_state.bred_animal[group_id_unparsed]['family'] = fam_id
                            matching_fam = True
                            break
                    if matching_fam:
                        continue

                ped_state.gen_id_unparsed_to_uuid[group_id_unparsed] = child_family_id
                ped_state.families[child_family_id] = {'group_id': group_id,
                                                       'cross_date': cross_year,
                                                       'id': child_family_id,
                                                       'parent_1': parent_1_uuid,
                                                       'parent_2': parent_2_uuid
                                                       }
                cross_year_group_id_to_fam.setdefault(group_id, []).append(child_family_id)

                f = ped_state.f_matrix.add_row(child_family_id, parent_1_fam_uuid, parent_2_fam_uuid)
                ped_state.families[child_family_id]['f'] = f
                if parent_1 not in ped_state.bred_animal:
                    # WT Cross di is 0
                    ped_state.families[child_family_id]['di'] = 0
                else:
                    # Calculate di
                    p1_di = ped_state.families[parent_1_fam_uuid]['di']
                    p2_di = ped_state.families[parent_2_fam_uuid]['di']
                    ped_state.families[child_family_id]['di'] = (p2_di + p1_di)/2 + 1
                    ped_state.last_years_parents.append((parent_1, parent_2))

        # Remove the un-bred WT animals and their families
        for wt_animal_group_id in ped_state.wt_animal_unbred.keys():
            wt_animal = ped_state.wt_animal.pop(wt_animal_group_id)
            ped_state.families.pop(wt_animal['family'])

        # Remove the bred fish from THIS year because they don't actually exist and are only place holders to
        # determine the f values for their families if they do exist
        bred_animal_gen_ids = list(ped_state.bred_animal.keys())
        for gen_id in bred_animal_gen_ids:
            if 180000 < int(gen_id) < 190000:
                fish = ped_state.bred_animal.pop(gen_id)
                ped_state.pedigrees.pop(fish['id'])

    except Exception as any_e:
        LOGGER.exception("Failed parsing pedigree data.")
        raise any_e


def _read_pedigree_values(line):
    if len(line) < 3:
        # If we don't have at least 3 values, probably a header, but definitely not data.
        # More than 3 is unexpected, we'll assume it's just data and any additional columns
        # are notes which we will ignore for now.
        return None, None, None
    try:
        group_id_unparsed = line[PedigreeDataCols.GROUP_ID.value]
        parent_1 = line[PedigreeDataCols.PARENT_1.value]
        parent_2 = line[PedigreeDataCols.PARENT_2.value]
    except IndexError:
        # If we don't have 3 values with length, probably a header, but definitely not data so
        # just skip it
        return None, None, None
    else:
        if not len(group_id_unparsed) or not parent_2 or not parent_1:
            # If we don't have 3 values with length, probably a header, but definitely not data so
            # just skip it
            return None, None, None

    return group_id_unparsed, parent_1, parent_2


# Not currently in use, but may switch back to this method so keeping for now
def parse_f_file(f_file_path, ped_state):
    try:
        with (open(f_file_path, mode='r', encoding='UTF-8') as f_data):
            for line in csv.reader(f_data):
                # Check for header
                if line[FDataCols.CROSS_YEAR.value].lower() == 'cross_year':
                    continue
                cross_year = int(line[FDataCols.CROSS_YEAR.value])
                group_id = int(line[FDataCols.GROUP_ID.value])
                f_val = float(line[FDataCols.F_VAL.value])
                ped_state.f_values.setdefault(cross_year, {})[group_id] = f_val
    except Exception as e:  # noqa
        LOGGER.exception(f"Exception parsing f_values file: {e}")
