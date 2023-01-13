import csv
from enum import Enum

from db_utils.insert import insert_records
from exceptions.exceptions import BadFishDataDuplicateTag


class MasterDataCols(Enum):
    Notes = 0,
    Id = 1,
    Sex = 2,
    Family_Id = 3,
    Box = 4,
    ALLELE_1 = 5,
    ALLELE_N = 154


def import_masterdata(data, tag_date, alive, birth_year):
    refuge_tag_cols = ["tag", "date_tagged"]
    family_cols = ["sibling_birth_year", "group_id"]
    fish_cols = ["sex", "box", "alive", "sibling_in"]
    gene_cols = ["name", "allele_1", "allele_2", "fish"]

    fish_tags = {}
    fish = {}
    families = {}
    genes = {}
    notes = {}
    for line in csv.reader(data.splitlines()):
        fish_tag = line[MasterDataCols.Id.value()]
        if fish_tag in fish_tags:
            raise BadFishDataDuplicateTag()
        fish_tags[fish_tag] = {"tag": fish_tag, "date_tagged":tag_date}
        fish[fish_tag] = {"sex": line[MasterDataCols.Sex.value()],
                          "box": line[MasterDataCols.Box.value()],
                          "alive": alive}
        family_group = line[MasterDataCols.Family_Id.value()]
        if family_group not in families:
            families[fish_tag] = [{"sibling_birth_year": birth_year, "group_id": family_group}]
        for allele_idx, col in enumerate(range(MasterDataCols.ALLELE_1.value(), MasterDataCols.ALLELE_N.value(), 2)):
            genes[f"{fish_tag}_{allele_idx}"] = {"name":f"Htr-GVL-00{allele_idx + 1}",
                                                 "allele_1":list[col],
                                                 "allele_2":list[col+1]}

    insert_records('fish', fish_cols, list(fish.values()))
