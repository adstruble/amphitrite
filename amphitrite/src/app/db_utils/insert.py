import time
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
        self.constraint_action = None
        self.temp_table_update = None

    def set_constraint_action(self, constraint_action):
        self.constraint_action = constraint_action

    def set_temp_table_update(self, temp_table_update):
        self.temp_table_update = temp_table_update


def batch_insert_records(table_data: list[InsertTableData], username):
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
                    buffer = StringIO()
                    csv_writer = DictWriter(buffer, table.data[0].keys())
                    csv_writer.writerows(table.data)
                    # df.to_csv(buffer, index=False, header=False, sep=",", quoting=csv.QUOTE_MINIMAL, na_rep="\\N")
                    buffer.seek(0)

                    cursor.execute(text(f"CREATE TABLE IF NOT EXISTS {table.name}_insert (LIKE {table.name} INCLUDING DEFAULTS EXCLUDING INDEXES)")),
                    cursor.execute(text(f"TRUNCATE TABLE {table.name}_insert"))
                    cursor.execute(text(f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS tag_temp varchar(12)"))
                    cursor.execute(text(f"ALTER TABLE {table.name}_insert ADD COLUMN IF NOT EXISTS sibling_birth_year_temp int"))
                    cursor.execute(text(f"SELECT drop_null_constraints('{table.name}_insert')"))

                    col_str = ",".join([f"\"{col}\"" for col in table.data[0].keys()])
                    cursor.copy_expert(f"COPY {table.name}_insert ({col_str}) FROM STDIN WITH (FORMAT CSV, NULL '\\N')",
                                       buffer)

                    if table.temp_table_update:
                        cursor.execute(table.temp_table_update)

                    # Remove the temp columns for the INSERT INTO <actual table> SELECT
                    col_str_no_temps = ",".join([f"\"{col}\"" for col in list(table.data[0].keys())[:-2]])

                    insert_str = f"""INSERT INTO {table.name} ({col_str_no_temps})
                                          SELECT {col_str_no_temps} from {table.name}_insert
                                           WHERE NOT EXISTS (
                                                SELECT 1
                                                FROM refuge_tag as rt
                                                JOIN fish ON rt.fish = fish.id
                                                JOIN family ON family.id = fish.family
                                                JOIN {table.name}_insert temp_i
                                                    ON temp_i.tag_temp = rt.tag
                                                   AND temp_i.sibling_birth_year_temp = family.sibling_birth_year
                                           ) {'' if table.constraint_action is None else table.constraint_action}
                             """

                    cursor.execute(text(insert_str))
                    results[table.name] = cursor.rowcount
            cursor.close()
        return {"success": results}

    except IntegrityError as ie:
        if ie.orig is errors.ForeignKeyViolation:
            LOGGER.exception(f"ForeignKeyViolation: {ie.orig.args} {ie.orig.diag}", fkv)
            return {"error": f"ForeignKeyViolation: {ie.orig.args} {ie.orig.diag}"}
        else:
            LOGGER.exception("Exception during batch insert of records", ie.orig)
            return {"error": str(ie.orig)}
    except Exception as any:
        LOGGER.exception("Exception during batch insert of records", any)
        return {"error": str(any)}


