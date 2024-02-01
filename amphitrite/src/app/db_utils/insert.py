from csv import DictWriter
from io import StringIO
from sqlite3 import IntegrityError

from psycopg2 import errors, ProgrammingError
from sqlalchemy import text

from amphi_logging.logger import get_logger
from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS


LOGGER = get_logger('importer')


class InsertTableData:
    def __init__(self, name: str, data: list[dict]):
        self.name = name
        self.data = data
        self.insert_condition = None
        self.temp_table_updates = []

    def set_insert_condition(self, constraint_action):
        self.insert_condition = constraint_action

    def add_temp_table_update(self, temp_table_update):
        self.temp_table_updates.append(temp_table_update)


def batch_insert_master_data(table_data: list[InsertTableData], username):
    """
    Creates an insert statement for the given column in the given table. ONLY if the given refuge tag
    doesn't already exist in the db
    :param table_data: Table that the records should be inserted into, the last 2 keys of the data dict
    must be tag_temp and sibling_birth_year_temp
    :param username: user that is performing the batch upload
    """
    results = dict()
    table_for_error = ""
    try:
        with get_connection(DEFAULT_DB_PARAMS, username) as conn:
            with conn.connection.cursor() as cursor:
                for table in table_data:
                    table_for_error = table
                    custom_alters = [
                        f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS tag_temp varchar(12)",
                        f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS sibling_birth_year_temp timestamp"]
                    custom_alters.extend(table.temp_table_updates)
                    col_str = prepare_copy_table_for_bulk_insert(table, cursor, custom_alters)

                    insert_str = f"""INSERT INTO {table.name} ({col_str})
                                          SELECT {col_str} from {table.name}_insert
                                            { '' if table.insert_condition is None else table.insert_condition}
                             """

                    cursor.execute(insert_str)
                    results[table.name] = cursor.rowcount
            cursor.close()
        return {"success": results}

    except IntegrityError as ie:
        if hasattr(ie, 'orig'):
            if ie.orig is errors.ForeignKeyViolation:
                LOGGER.exception(f"ForeignKeyViolation: {ie.orig.args} {ie.orig.diag}", ie.orig)
                return {"error": f"ForeignKeyViolation: {ie.orig.args} {ie.orig.diag}"}
            else:
                LOGGER.exception(f"Exception during batch insert of {table_for_error} records", ie)
                return {"error": str(ie.orig)}
        else:
            LOGGER.exception(f"Exception during batch insert of {table_for_error} master data", ie)
            return {"error": str(ie)}


def batch_insert_cross_data(table: InsertTableData, username):
    try:
        results = {}
        with get_connection(DEFAULT_DB_PARAMS, username) as conn:
            with conn.connection.cursor() as cursor:
                custom_alters = [
                    f"ALTER TABLE family_insert ADD COLUMN IF NOT EXISTS parent_1_tag_temp varchar(12)",
                    f"ALTER TABLE family_insert ADD COLUMN IF NOT EXISTS parent_2_tag_temp varchar(12)",
                    f"ALTER TABLE family_insert ADD COLUMN IF NOT EXISTS parent_1_birth_year_temp numeric",
                    f"ALTER TABLE family_insert ADD COLUMN IF NOT EXISTS parent_2_birth_year_temp numeric",
                    f"ALTER TABLE family_insert ADD COLUMN IF NOT EXISTS parent_1_temp uuid",
                    f"ALTER TABLE family_insert ADD COLUMN IF NOT EXISTS parent_2_temp uuid",
                    'ALTER TABLE family_insert drop column cross_year',
                    'ALTER TABLE family_insert ADD COLUMN cross_year numeric GENERATED ALWAYS AS '
                    '(extract(year from cross_date)) STORED']
                prepare_copy_table_for_bulk_insert(table, cursor, custom_alters)

                set_fish_id_update_template = """
                UPDATE family_insert SET {parent} = fish.id
                        FROM fish
                        JOIN refuge_tag rt ON fish = fish.id
                        JOIN family as fam ON fish.family = fam.id
                        WHERE {parent}_tag_temp = rt.tag
                        AND fam.cross_year = {parent}_birth_year_temp"""
                cursor.execute(set_fish_id_update_template.format(parent='parent_1'))
                cursor.execute(set_fish_id_update_template.format(parent='parent_2'))

                insert_missing_fish_family_template = """
                INSERT INTO family (id, group_id, cross_date)
                    SELECT gen_random_uuid(), -1, (({parent}_birth_year_temp::text) || '-01-01')::timestamp
                    FROM family_insert
                    WHERE {parent} = {parent}_temp LIMIT 1
                    ON CONFLICT ON CONSTRAINT unique_family_no_parents DO NOTHING"""
                cursor.execute(insert_missing_fish_family_template.format(parent='parent_1'))
                cursor.execute(insert_missing_fish_family_template.format(parent='parent_2'))

                insert_missing_fish_template = """
                INSERT INTO fish (id, sex, family) SELECT fi.{parent}, '{sex}', family.id
                    FROM family_insert as fi
                    JOIN family ON family.cross_year = fi.{parent}_birth_year_temp
                    WHERE fi.{parent} = fi.{parent}_temp
                    AND family.group_id = -1"""
                # By convention fish 1 is male and fish 2 is female
                cursor.execute(insert_missing_fish_template.format(parent='parent_1', sex='F'))
                results['fish'] = cursor.rowcount
                cursor.execute(insert_missing_fish_template.format(parent='parent_2', sex='M'))
                results['fish'] = results['fish'] + cursor.rowcount

                insert_missing_fish_tag_template = """INSERT INTO refuge_tag (id, tag, fish)
                                                    SELECT gen_random_uuid(), {parent}_tag_temp, {parent}
                                            FROM family_insert where {parent} = {parent}_temp"""
                cursor.execute(insert_missing_fish_tag_template.format(parent='parent_1'))
                results['refuge_tag'] = cursor.rowcount
                cursor.execute(insert_missing_fish_tag_template.format(parent='parent_2'))
                results['refuge_tag'] = results['refuge_tag'] + cursor.rowcount

                insert_update_sibling_families = """INSERT INTO family (id, cross_date, group_id, parent_1, parent_2)
                                            SELECT gen_random_uuid(),
                                                   cross_date,
                                                   group_id,
                                                   parent_1,
                                                   parent_2
                                            FROM family_insert
                                            ON CONFLICT ON CONSTRAINT unique_family_no_parents
                                            DO UPDATE SET (cross_date, parent_1, parent_2) =
                                                (excluded.cross_date, excluded.parent_1, excluded.parent_2)
                """
                cursor.execute(insert_update_sibling_families)
                results = {'family': cursor.rowcount}
                return {'success': results}
                
    except Exception as e: # noqa
        LOGGER.exception("Exception during batch insert of crosses", e)
        return {"error": str(e)}


def prepare_copy_table_for_bulk_insert(table: InsertTableData, cursor, custom_alters: list ):
    """
    (1) Sets up the copy table for bulk insert to actual table
    :param table The table to be inserted
    :param cursor Database connection cursor
    :param custom_alters List of custom alter statements to be executed before insert of data into copy table
    :return Col string that will be used for copying to final table
    """
    buffer = StringIO()
    csv_writer = DictWriter(buffer, table.data[0].keys())
    csv_writer.writerows(table.data)
    # df.to_csv(buffer, index=False, header=False, sep=",", quoting=csv.QUOTE_MINIMAL, na_rep="\\N")
    buffer.seek(0)

    cursor.execute(f"CREATE TABLE IF NOT EXISTS {table.name}_insert"
                   f" (LIKE {table.name} INCLUDING DEFAULTS EXCLUDING INDEXES)")
    cursor.execute(f"TRUNCATE TABLE {table.name}_insert")
    for alter_statement in custom_alters:
        cursor.execute(alter_statement)
    cursor.execute(f"SELECT drop_null_constraints('{table.name}_insert')")

    col_str = ",".join([f"\"{col}\"" for col in table.data[0].keys()])

    cursor.copy_expert(f"COPY {table.name}_insert ({col_str}) FROM STDIN WITH (FORMAT CSV, NULL '\\N')", buffer)

    for update in table.temp_table_updates:
        cursor.execute(update)

    return ",".join([f"\"{col}\"" for col in list(table.data[0].keys())[:-2]])
