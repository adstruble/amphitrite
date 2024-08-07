import concurrent
import multiprocessing
import uuid
from concurrent.futures import ProcessPoolExecutor
from datetime import date, datetime

import networkx as nx

from amphi_logging.logger import get_logger
from model.fish_family import get_family_pedigree
from model.crosses import get_possible_crosses
from utils.data_conversions import get_group_id_from_parent
from model.fish import get_fish_available_for_crossing

LOGGER = get_logger('cross-selection')


def calculate_f_path_analysis(pedigree_graph, bred_animal, families, parent_1, parent_2):
    ancestors = nx.ancestors(pedigree_graph, parent_1)
    f_total = 0
    for ancestor in ancestors:
        if not nx.has_path(pedigree_graph, ancestor, parent_2):
            # networkx suggests using has_path first before all_simple_paths for large graphs for performance
            continue

        f_ca = 0
        if bred_animal.get(ancestor):
            f_ca = families[bred_animal[ancestor]['family']]['f']

        p2_paths = nx.all_simple_paths(pedigree_graph, ancestor, parent_2)
        p1_paths = list(nx.all_simple_paths(pedigree_graph, ancestor, parent_1))
        for p2_path in p2_paths:

            for p1_path in p1_paths:
                if p2_path[1] == p1_path[1]:
                    # Skip the Path if both paths go through common descendent
                    continue

                f_total += (1/2**(len(p2_path) * 2 - 1) * (1 + f_ca))
    return f_total


def calculate_fs_for_year_path_analysis(ped_state, f_calc_year):
    with ProcessPoolExecutor(max_workers=multiprocessing.cpu_count() - 2) as executor:
        future_fs = {executor.submit(calculate_f_path_analysis,
                                     ped_state.pedigree_graph, ped_state.bred_animal, ped_state.families,
                                     parents[0],
                                     parents[1]):
                     parents for parents in ped_state.last_years_parents}
        for future in concurrent.futures.as_completed(future_fs):
            parents = future_fs[future]
            try:
                calculated_f = future.result()
            except Exception as exc:
                LOGGER.exception('%r generated an exception: %s' % (parents, exc))
                LOGGER.exception('%r generated an exception: %s' % (parents, exc))
                raise exc

            child_group_id = get_group_id_from_parent(parents[0], f_calc_year)
            child_fam_ids = ped_state.group_id_to_fam_uuid_by_date[date(f_calc_year, 1, 1)][child_group_id]
            f_calc_parent_1_uuid = ped_state.bred_animal[parents[0]]['id']
            f_calc_parent_2_uuid = ped_state.bred_animal[parents[1]]['id']

            for fam_id in child_fam_ids:
                # We can have multiple fams with same group ids because of 2 year olds, make sure parents
                # are a match
                if ((f_calc_parent_1_uuid == ped_state.families[fam_id]['parent_1'] and
                     f_calc_parent_2_uuid == ped_state.families[fam_id]['parent_2']) or
                        (f_calc_parent_1_uuid == ped_state.families[fam_id]['parent_2'] and
                         f_calc_parent_2_uuid == ped_state.families[fam_id]['parent_1'])):
                    ped_state.families[fam_id]['f'] = calculated_f


class FMatrixRow:
    def __init__(self, animal, parent_1, parent_2):
        self.animal = animal
        self.parent_1 = parent_1
        self.parent_2 = parent_2
        self.row_vals = {animal: 1}
        self.id = str(uuid.uuid4())

    def add_row_val(self, animal, val):
        self.row_vals[animal] = val

    def get_row_val(self, parent):
        if parent not in self.row_vals:
            return 0
        return self.row_vals[parent]

    def get_animal(self):
        return self.animal

    def get_row_val_dicts(self):
        row_val_dicts = []
        for animal, val in self.row_vals.items():
            row_val_dicts.append({"id": uuid.uuid4(),
                                  "matrix_row": self.id,
                                  "animal_fam": animal,
                                  "val": val})
        return row_val_dicts


class FMatrix:
    def __init__(self):
        self.rows = []
        self.year_indices = {}

    def new_cross_year(self, year):
        self.year_indices[year] = len(self.rows)
        # We can remove data older than 2 years because it's no longer needed to calculate fs of later generations
        rows_removed = 0
        if year - 2 in self.year_indices:
            rows_removed = self.year_indices.pop(year - 1)
            self.rows = self.rows[rows_removed:]

        for year in self.year_indices.keys():
            self.year_indices[year] = self.year_indices[year] - rows_removed

    def add_row(self, animal, parent_1, parent_2):
        parents_val = None
        matrix_row = FMatrixRow(animal, parent_1, parent_2)

        for row in self.rows:
            animal_row_val = (row.get_row_val(parent_1) + row.get_row_val(parent_2)) / 2
            # Add val as additional val to prev existing row (represents new column being added)
            row.add_row_val(animal, animal_row_val)
            # Add val to the new row being added
            matrix_row.add_row_val(row.get_animal(), animal_row_val)
            if row.get_animal() == parent_1:
                parents_val = row.get_row_val(parent_2)
                # This is the diagonal element, which is 1 + parents val/2
                # This is also the f val!!
                matrix_row.add_row_val(animal, 1 + parents_val/2)

        self.rows.append(matrix_row)

        return parents_val/2 if parents_val else 0

    def get_matrix_dicts(self, start_idx, end_idx):
        """
        Gets the matrix for the given row indices as two sets of dictionaries: the rows and row values.
        Will reset end_idx to last row of matrix if end_idx is > size of matrix
        :param start_idx:
        :param end_idx:
        :return: a tuple of lists of dictionaries, one of who the row represents (animal and its parents). The other
        is the row values
        """
        row_dicts = []
        val_dicts = []
        if end_idx > len(self.rows):
            end_idx = len(self.rows)
        for row_idx in range(start_idx, end_idx):
            row = self.rows[row_idx]
            row_dicts.append({"id": row.id,
                              "animal_fam": row.animal,
                              "parent_1_fam": row.parent_1,
                              "parent_2_fam": row.parent_2})
            val_dicts.extend(row.get_row_val_dicts())

        return row_dicts, val_dicts

    def calculate_f_for_potential_cross(self, parent_1, parent_2):

        for row in self.rows:
            if row.get_animal() == parent_1:
                parents_val = row.get_row_val(parent_2)
                return parents_val/2
            elif row.get_animal == parent_2:
                parents_val = row.get_row_val(parent_1)
                return parents_val/2


def build_matrix_from_existing(username):
    f_matrix = FMatrix()
    for cross_year in range(2006, datetime.now().year):
        family_pedigree = get_family_pedigree(username, cross_year)
        for cross in family_pedigree:
            f_matrix.add_row(cross['child_fam_id'], cross['p1_fam_id'], cross['p2_fam_id'])
        f_matrix.new_cross_year(cross_year)
    return f_matrix


def rank_available_crosses_by_f(username):
    """
    Calculates the f values for all the crosses of the available fish
    :username user that is executing cross selection
    :return: f values and fam_ids for all the possible crosses of available fish
    """

    f_matrix = build_matrix_from_existing(username)
    LOGGER.info("F Matrix build complete")
    possible_crosses, possible_crosses_cnt = get_possible_crosses(username)
    for cross_idx, cross in enumerate(possible_crosses):
        cross['f'] = f_matrix.calculate_f_for_potential_cross(cross['p1_fam_id'], cross['p2_fam_id'])

    possible_crosses.sort(key=lambda c:  c['f'])
    return possible_crosses, possible_crosses_cnt
