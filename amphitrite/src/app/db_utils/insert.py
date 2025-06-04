from csv import DictWriter
from io import StringIO
from sqlite3 import IntegrityError

from psycopg2 import errors

from amphi_logging.logger import get_logger
from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS, make_connection_kwargs

LOGGER = get_logger('importer')


class InsertTableData:
    def __init__(self, name: str, data: list[dict], insert_condition=None):
        self.name = name
        self.data = data
        self.insert_condition = insert_condition
        self.temp_table_updates = []
        self.columns = []
        if data:
            self.columns = data[0].keys()

    def set_insert_condition(self, constraint_action):
        self.insert_condition = constraint_action

    def add_temp_table_update(self, temp_table_update):
        self.temp_table_updates.append(temp_table_update)

    def get_col_string(self):
        ",".join([f"\"{col}\"" for col in list(self.data[0].keys())[:-2]])


def batch_insert_master_data(table_data: list[InsertTableData], username):
    """
    Creates an insert statement for the given column in the given table. ONLY if the given refuge tag
    doesn't already exist in the db
    :param table_data: Table that the records should be inserted into, the last 2 keys of the data dict
    must be tag_temp and sibling_birth_year_temp
    :param username: user that is performing the batch upload
    """
    results = {'updated': dict(), 'inserted': dict()}
    table_for_error = ""
    try:
        with get_connection(**make_connection_kwargs(DEFAULT_DB_PARAMS, username)) as conn:
            with conn.connection.cursor() as cursor:
                for table in table_data:
                    if not table.data:
                        continue
                    table_for_error = table
                    custom_alters = [
                        f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS sibling_birth_year_temp numeric",
                        f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS group_id_temp int NOT NULL"]
                    custom_alters.extend(table.temp_table_updates)
                    prepare_copy_table_for_bulk_insert(table, cursor, custom_alters)
                    final_table_col_str = ",".join([f"\"{col}\"" for col in list(table.data[0].keys())[:-2]])
                    inserts, updates = copy_to_final_table(table, cursor, final_table_col_str)

                    results['updated'][table.name] = updates
                    results['inserted'][table.name] = inserts

            cursor.close()
        return {"success": results}

    except IntegrityError as ie:
        if hasattr(ie, 'orig'):
            if ie.orig is errors.ForeignKeyViolation:
                LOGGER.exception(f"ForeignKeyViolation: {ie.orig.args} {ie.orig.diag}")
                return {"error": f"ForeignKeyViolation: {ie.orig.args} {ie.orig.diag}"}
            else:
                LOGGER.exception(f"Exception during batch insert of {table_for_error} records")
                return {"error": str(ie.orig)}
        else:
            LOGGER.exception(f"Exception during batch insert of {table_for_error} master data")
            return {"error": str(ie)}


def copy_to_final_table(table: InsertTableData, cursor, col_str=None):
    """
    :param table:  table to copy
    :param cursor: current db cursor
    :param col_str: columns to copy
    :return: Returns tuple of counts: (inserts, updates)
    """
    cursor.execute(f"SELECT COUNT(*) FROM {table.name}")
    start_cnt = cursor.fetchone()[0]

    if not col_str:
        col_str = ",".join([f"\"{col}\"" for col in list(table.data[0].keys())])
    insert_str = f"""INSERT INTO {table.name} ({col_str})
                                          SELECT {col_str} from {table.name}_insert
                                            { '' if table.insert_condition is None else table.insert_condition}
                             """

    cursor.execute(insert_str)
    changed = cursor.rowcount
    cursor.execute(f"SELECT COUNT(*) FROM {table.name}")
    end_cnt = cursor.fetchone()[0]
    return end_cnt - start_cnt, changed - (end_cnt - start_cnt)


def batch_insert_cross_data(table: InsertTableData, username):
    try:
        results = {}
        with get_connection(**make_connection_kwargs(DEFAULT_DB_PARAMS, username)) as conn:
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

                set_animal_id_update_template = """
                UPDATE family_insert SET {parent} = animal.id
                        FROM animal
                        JOIN refuge_tag rt ON animal = animal.id
                        JOIN family as fam ON animal.family = fam.id
                        WHERE {parent}_tag_temp = rt.tag
                        AND fam.cross_year = {parent}_birth_year_temp"""
                cursor.execute(set_animal_id_update_template.format(parent='parent_1'))
                cursor.execute(set_animal_id_update_template.format(parent='parent_2'))

                insert_update_sibling_families = """INSERT INTO family (id, cross_date, group_id, parent_1, parent_2)
                                            SELECT gen_random_uuid(),
                                                   cross_date,
                                                   group_id,
                                                   parent_1,
                                                   parent_2
                                            FROM family_insert
                """
                cursor.execute(insert_update_sibling_families)
                results = {'family': cursor.rowcount}
                return {'success': results}

    except Exception as e: # noqa
        LOGGER.exception("Exception during batch insert of crosses")
        return {"error": str(e)}


def insert_table_data(table_name, data, cursor, insert_condition=None):
    table = InsertTableData(table_name, data, insert_condition)
    prepare_copy_table_for_bulk_insert(table, cursor, [])
    if not table.data:
        return 0, 0
    return copy_to_final_table(table, cursor)


def prepare_copy_table_for_bulk_insert(table: InsertTableData, cursor, custom_alters: list):
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
    with open(f'/tmp/out{table.name}.csv', 'w') as out_file:
        csv_writer = DictWriter(out_file, table.data[0].keys())
        csv_writer.writerows(table.data)
    # df.to_csv(buffer, index=False, header=False, sep=",", quoting=csv.QUOTE_MINIMAL, na_rep="\\N")
    buffer.seek(0)

    cursor.execute(f"DROP TABLE IF EXISTS {table.name}_insert")
    cursor.execute(f"CREATE TABLE {table.name}_insert"
                   f" (LIKE {table.name} INCLUDING DEFAULTS EXCLUDING INDEXES)")
    for alter_statement in custom_alters:
        cursor.execute(alter_statement)
    cursor.execute(f"SELECT drop_null_constraints('{table.name}_insert')")

    col_str = ",".join([f"\"{col}\"" for col in table.columns])

    cursor.copy_expert(f"COPY {table.name}_insert ({col_str}) FROM STDIN WITH (FORMAT CSV, NULL '\\N')", buffer)

    for update in table.temp_table_updates:
        cursor.execute(update)

    return
