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
    try:
        with get_connection(DEFAULT_DB_PARAMS, username) as conn:
            with conn.connection.cursor() as cursor:
                for table in table_data:
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
                LOGGER.exception("Exception during batch insert of records", ie.orig)
                return {"error": str(ie.orig)}
        else:
            LOGGER.exception("Exception during batch insert of master data", ie)
            return {"error": str(ie)}


def batch_insert_cross_data(table: InsertTableData, username):
    results = dict()
    try:
        with get_connection(DEFAULT_DB_PARAMS, username) as conn:
            with conn.connection.cursor() as cursor:
                custom_alters = [
                    f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS female_tag_temp varchar(12)",
                    f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS male_tag_temp varchar(12)",
                    f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS child_family_temp int"]
                col_str = prepare_copy_table_for_bulk_insert(table, cursor, custom_alters)
                insert_sibling_fam = f"""INSERT INTO family (id, cross_date, group_id)
                                            SELECT gen_random_uuid(),
                                                   EXTRACT(year from sibling_birth_year),
                                                   child_family_temp
                                            FROM {table.name}_insert
                                            ON CONFLICT ON CONSTRAINT unique_family_no_parents do NOTHING
                """
                insert_cross_str = f"""UPDATE {table.name} ({col_str}, female, male)
                                         SELECT {col_str}, fish_x.id, fish_y.id
                                         FROM {table.name}_insert
                                            JOIN refuge_tag as tag_x on female_tag_temp = tag
                                            JOIN fish as fish_x on fish_x.id = tag_x.fish
                                            JOIN family as family_x on fish.family = family_x.id
                                            JOIN refuge_tag as tag_y on male_tag_temp = tag
                                            JOIN fish as fish_y on fish_y.id = tag_y.fish
                                            JOIN family as family_y on fish.family = family_y.id
                                        RETURNING  as sibling_birth_year, 
                                                  child_family_temp as group_id
                """
                cursor.execute(insert_sibling_fam)
                
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
