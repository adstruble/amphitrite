import csv
from typing import TextIO

import click


@click.group()
def cli():
    pass


class RecCrossesDataCols(object):
    Date = 0
    Male = 1
    Female = 3
    Male_Sibling_Group = 2
    Female_Sibling_Group = 4
    MFG = 6


class BackupTanksResult:
    def __init__(self):
        self.sibling_group_included_final = set()
        self.tanks_included_final = set()
        self.num_combinations = 0
        self.desired_tank_count = 30


@cli.command()
@click.option('--recommended_crosses_file', '-r', required=True,
              help="Full file path to recommended crosses CSV file")
@click.option('--tank_count', '-t', required=False, default=30,
              help="The number of tanks that will be included as backups")
def determine_parents_backup_tanks(recommended_crosses_file, tank_count):
    """
    Determines the best combination of backup tanks to use, optimizing by number of distinct family groups represented.
    As input expects a recommended_crosses_file in csv format with the following columns:
    Date,Male,Male_Sibling_Group,Female,Female_Sibling_Group,<unused>,MFG
    While those are the expected columns, only the contents of the Male_Sibling_Group, Female_Sibling_Group
    and MFG are used.

    :param recommended_crosses_file
    :param tank_count Number of tanks to include as backups
    :return:
    """
    results_path = "./results.txt"
    with open(results_path, mode='w', encoding='UTF-8') as results_file:
        tanks = dict()  # MFGs to include (MFG #) : [sibling groups]
        tanks_included = set()
        sibling_groups_included = set()
        tank_results = BackupTanksResult()
        tank_results.desired_tank_count = tank_count
        try:
            header = ""
            with open(recommended_crosses_file, mode='r', encoding='UTF-8') as rec_crosses:
                try:
                    csv_lines = csv.reader(rec_crosses)
                    header = next(csv_lines, None)
                    # Check that we actually have recommended crosses by looking for correct column header
                    if not (header[RecCrossesDataCols.Date] == 'Date' and
                            header[RecCrossesDataCols.Male] == 'Male' and
                            header[RecCrossesDataCols.Female] == 'Female' and
                            header[RecCrossesDataCols.MFG].startswith('MFG')):
                        raise Exception("Not a valid recommended crosses sheet")

                except: # noqa
                    results_file.write(f"Data for recommended crosses sheet upload is not in valid CSV format. "
                                       f"Header of submitted file: {header}\n")
                    return {"error": "Data for recommended crosses sheet upload is not in valid CSV format."}

                for line in csv.reader(rec_crosses):
                    mfg = line[RecCrossesDataCols.MFG]
                    tanks.setdefault(mfg, set())
                    tanks[mfg].add(line[RecCrossesDataCols.Male_Sibling_Group])
                    tanks[mfg].add(line[RecCrossesDataCols.Female_Sibling_Group])

            tank_keys = list(tanks.keys())
            tank_keys.sort()

            add_sibling_group(tanks, tank_keys, tanks_included, sibling_groups_included, tank_results, results_file)
            results_file.writelines("Final recommended tanks to include: " + str(tanks_included) + "\n")
            results_file.flush()
        except Exception as e: # noqa
            results_file.write(f"Failure determining backup population: {str(any)}\n")


def add_sibling_group(tanks, tank_keys, tanks_included, sibling_groups_included, tank_results: BackupTanksResult,
                      results_file: TextIO):

    for i in range(len(tank_keys)):
        if len(tanks_included) == tank_results.desired_tank_count - 1:
            tank_results.num_combinations = tank_results.num_combinations + 1
            if tank_results.num_combinations % 1000000 == 0:
                results_file.write(f"Completed {tank_results.num_combinations}\n")
                results_file.flush()
            tank_set = {tank_keys[i]}
            sibling_group = tanks[tank_keys[i]]
            next_sibling_groups_included = sibling_groups_included.union(sibling_group)
            next_tanks_included = tanks_included.union(tank_set)
            if len(sibling_groups_included) > len(tank_results.sibling_group_included_final):
                tank_results.sibling_group_included_final = next_sibling_groups_included
                tank_results.tanks_included_final = next_tanks_included
                results_file.writelines([
                    f"New sibling group found with sibling count = {len(sibling_groups_included)}\n",
                    f"Tanks to include: {tank_results.tanks_included_final}\n",
                    f"Completed {tank_results.num_combinations}\n"])
                results_file.flush()
        else:
            next_tank_set = {tank_keys[i]}
            next_sibling_group = tanks[tank_keys[i]]
            add_sibling_group(tanks, tank_keys[i+1:], tanks_included.union(next_tank_set),
                              sibling_groups_included.union(next_sibling_group), tank_results, results_file)


if __name__ == '__main__':
    cli()

