import csv
import os
import uuid
from enum import Enum

from amphi_logging.logger import get_logger
from db_utils.core import execute_statements, ResultType
from db_utils.insert import InsertTableData, batch_insert_master_data
from exceptions.exceptions import BadFishDataDuplicateTag, BadFishDataTagFormatWrong
from importer.import_utils import maybe_correct_for_2_year_olds

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


def import_master_data(dir_name, username, job_id, year):

    refuge_tags = {}
    animals = []
    genes = []
    notes = []
    genotypes = {}
    genotype_dupes = {}
    try:
        header = ""
        with open(os.path.join(dir_name, f'bulk_upload_{job_id}'), mode='r', encoding='utf-8-sig') as master_data:
            try:
                csv_lines = csv.reader(master_data)
                header = next(csv_lines, None)
                # Check that we actually have a master sheet by looking for correct column header
                if not (header[MasterDataCols.ALLELE_1.value] == 'Htr-GVL-001_0'):
                    raise Exception("Not a valid master sheet")

            except: # noqa
                LOGGER.error(f"Data for master sheet upload is not in valid CSV format. Header of submitted file: {header}")
                complete_job(job_id, JobState.Failed.name, {"error": "Data for master sheet upload is not in valid CSV format."})
                return {"error": "Data for master sheet upload is not in valid CSV format."}

            for line in csv.reader(master_data):
                refuge_tag = line[MasterDataCols.Id.value]
                if refuge_tag in refuge_tags:
                    raise BadFishDataDuplicateTag(refuge_tag)
                elif refuge_tag == '':
                    LOGGER.warning("Line found with empty refuge tag, skipping")
                    continue

                csv_fam_id = line[MasterDataCols.Family_Id.value]
                pr = refuge_tag
                try:
                    sibling_birth_year, refuge_tag, group_id = maybe_correct_for_2_year_olds(year - 1, refuge_tag, csv_fam_id)
                except:
                    LOGGER.info(f"preinfo: {year}  -- {pr} -- {csv_fam_id} {e}")
                    LOGGER.info(f"info: {sibling_birth_year}  -- {refuge_tag} -- {group_id} {e}")
                    # Don't include this fish as data integrity is in question
                    continue
                if len(refuge_tag) > 6:
                    if len(refuge_tag) > 12:
                        raise BadFishDataTagFormatWrong(refuge_tag)
                    else:
                        LOGGER.warning(f"Nonstandard tag was found: '{refuge_tag}'. Hopefully this fish is dead.")
                        # TODO Mark as do not cross and add a note

                animal_id = str(uuid.uuid4())
                alive = True
                if group_id is None:
                    # If fish previously existed and now it's group it is None, this is our indication that it is dead
                    alive = False
                    group_id = '\\N'
                elif group_id == -1 or (group_id > 324 and sibling_birth_year.year == 2023) or \
                    (group_id > 343 and sibling_birth_year.year == 2022):
                    LOGGER.warning(f"Invalid family group_id: '{line[MasterDataCols.Family_Id.value]}' for: {refuge_tag}. "
                                   f"Fish record will be skipped.")
                    continue

                refuge_tags[line[MasterDataCols.Id.value]] = {"tag": refuge_tag,
                                                              "animal": animal_id,
                                                              "id": str(uuid.uuid4()),
                                                              "year": year,
                                                              "sibling_birth_year_temp": sibling_birth_year.year,
                                                              "group_id_temp": group_id}

                genotype_string = ""
                for allele_idx, col in enumerate(range(MasterDataCols.ALLELE_1.value, MasterDataCols.ALLELE_N.value, 2)):
                    genes.append({"name": f"Htr-GVL-00{allele_idx + 1}",
                                  "allele_1": line[col],
                                  "allele_2": line[col+1],
                                  "animal": animal_id,
                                  "id": str(uuid.uuid4()),
                                  "sibling_birth_year_temp": sibling_birth_year.year,
                                  "group_id_temp": group_id})
                    genotype_string = f'{genotype_string}{line[col]}{line[col+1]}'

                if genotype_string in genotypes:
                    genotype_dupes[genotype_string] = True
                    genotypes[genotype_string].append((line[MasterDataCols.Id.value],line[MasterDataCols.Family_Id.value],
                                                       line[MasterDataCols.Box.value]))
                else:
                    genotypes[genotype_string] = [(line[MasterDataCols.Id.value],line[MasterDataCols.Family_Id.value],
                                                   line[MasterDataCols.Box.value])]

                try:
                    box = int(line[MasterDataCols.Box.value])
                except Exception: # noqa:
                    box = "\\N"
                animal = {"sex": line[MasterDataCols.Sex.value].upper(),
                          "box": box,
                          "id": animal_id,
                          "family": "\\N",
                          "genotype": genotype_string,
                          "alive": alive,
                          "sibling_birth_year_temp": sibling_birth_year.year,
                          "group_id_temp": group_id}
                if not(animal['sex'] == 'M' or animal['sex'] == 'F'):
                    animal['sex'] = 'UNKNOWN'
                animals.append(animal)

                if line[MasterDataCols.Notes.value].strip():
                    note = {"id": str(uuid.uuid4()),
                            "content": line[MasterDataCols.Notes.value].strip(),
                            "animal": animal_id,
                            "sibling_birth_year_temp": sibling_birth_year.year,
                            "group_id_temp": group_id,}
                    notes.append(note)

            if genotype_dupes:
                error = "Duplicate genotypes:"
                for genotype in genotype_dupes:
                    dupes = []
                    for idx, (tag, family, box) in enumerate(genotypes[genotype]):
                        dupes.append(f"[Tag:{tag} Family:{family} Box:{box}]")

                    error += f"\n{f', '.join(dupes)} have same genotype: {genotype}"
                LOGGER.error(error)
                complete_job(job_id, JobState.Failed.name, {"error": str(error)})
                return

            animal_table_data = InsertTableData('animal', animals)
            animal_table_data.add_temp_table_update("""UPDATE animal_insert a_i SET (family) = (
                                                     SELECT f.id FROM family as f
                                                     WHERE a_i.group_id_temp = f.group_id
                                                     AND a_i.sibling_birth_year_temp = f.cross_year)""")
            # If the fish died, the group_id will be null, update the family of the record to be inserted with the
            # family of a matching fish by genotype. Then we will only insert animals that don't have null families
            # (fish dies before fish was ever uploaded)
            animal_table_data.add_temp_table_update("""UPDATE animal_insert a_i SET (family) = (
                                                     SELECT family FROM animal as a
                                                     WHERE a.genotype = a_i.genotype) WHERE a_i.group_id_temp IS NULL""")
            animal_table_data.set_insert_condition(""" WHERE animal_insert.family is NOT NULL ON CONFLICT (genotype) DO UPDATE 
              SET (sex, box, family, alive) = (EXCLUDED.sex, EXCLUDED.box, EXCLUDED.family, EXCLUDED.alive)
            WHERE animal.genotype = EXCLUDED.genotype 
              AND (animal.sex != EXCLUDED.sex OR animal.box != EXCLUDED.box OR animal.family != EXCLUDED.family OR
              animal.alive != EXCLUDED.alive)""")

            gene_table_data = InsertTableData('gene', genes)
            gene_table_data.set_insert_condition(" WHERE animal = ANY (SELECT id FROM animal) ON CONFLICT (name, animal) DO NOTHING") # noqa
            gene_table_data.add_temp_table_update("""UPDATE gene_insert as gi SET (animal) = (SELECT a.id)
                                                       FROM animal a 
                                                       JOIN animal_insert a_i ON a_i.genotype = a.genotype
                                                      WHERE gi.animal = a_i.id""")

            refuge_tag_data = InsertTableData('refuge_tag', list(refuge_tags.values()))
            refuge_tag_data.add_temp_table_update("""
            UPDATE refuge_tag_insert rt_i SET (animal) = (SELECT a.id)
                  FROM animal a 
                  JOIN animal_insert a_i ON a_i.genotype = a.genotype
                 WHERE rt_i.animal = a_i.id""")
            refuge_tag_data.set_insert_condition(""" WHERE animal = ANY (SELECT id from animal) ON CONFLICT (animal) DO UPDATE
              SET (tag, year) = (EXCLUDED.tag, EXCLUDED.year)
            WHERE refuge_tag.animal = EXCLUDED.animal AND (refuge_tag.tag != EXCLUDED.tag)""")

            notes_data = InsertTableData('animal_note', notes)
            notes_data.add_temp_table_update("""
            UPDATE animal_note_insert n_i SET (animal) = (SELECT a.id)
              FROM animal a
              JOIN animal_insert a_i ON a_i.genotype = a.genotype
             WHERE n_i.animal = a_i.id""")
            notes_data.set_insert_condition(
                """WHERE (content) NOT IN (SELECT content FROM animal_note n where animal_note_insert.animal = n.animal) 
                AND animal = ANY(SELECT id FROM animal) ON CONFLICT (animal) DO UPDATE SET content = EXCLUDED.content
                WHERE animal_note.animal = EXCLUDED.animal""")
            table_data = [animal_table_data,
                          refuge_tag_data,
                          gene_table_data,
                          notes_data]

        insert_result = batch_insert_master_data(table_data, username)

        # Remove possible crosses since we now have new fish to consider for crossing
        execute_statements(["TRUNCATE possible_cross"], username, ResultType.NoResult)
        if 'error' in insert_result:
            complete_job(job_id, JobState.Failed.name, insert_result)
        else:
            complete_job(job_id, JobState.Complete.name, insert_result)
    except Exception as any_e:
        LOGGER.exception(f"Failed {job_id} importing master data.")
        complete_job(job_id, JobState.Failed.name, {"error": str(any_e)})


def get_birthyear_from_master_filename(filename: str):
    return int(filename[0:4])
