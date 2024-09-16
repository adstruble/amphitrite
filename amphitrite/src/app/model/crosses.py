import uuid
import datetime

from algorithms.f_calculation import build_matrix_from_existing
from amphi_logging.logger import get_logger
from db_utils.core import execute_statements, ResultType
from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS
from db_utils.insert import insert_table_data

LOGGER = get_logger('cross-fish')


def get_new_possible_crosses_for_females(username, f_tags):
    new_possible_crosses_sql = """SELECT * FROM (
        SELECT  xf.id female_fam,
                yf.id male,
                x.id female,
                (xf.di + yf.di) / 2 + 1 di
        FROM refuge_tag rtx
                JOIN animal as x on x.id = rtx.animal
                JOIN animal as y ON TRUE
                JOIN family as xf ON x.family = xf.id
                JOIN family as yf ON y.family = yf.id
                JOIN refuge_tag rty ON rty.animal = y.id
           LEFT JOIN possible_cross pc ON pc.female = rtx.animal
           LEFT JOIN family next_gen_fam ON next_gen_fam.parent_1 = x.id and next_gen_fam.parent_2 = y.id
           LEFT JOIN refuge_tag y_crossed_tag ON y_crossed_tag.animal = next_gen_fam.parent_2 AND next_gen_fam.id IS NOT NULL
               WHERE x.sex = 'F' AND y.sex = 'M' AND pc.id is NULL AND rtx.tag = ANY (:f_tags)
            GROUP BY rtx.tag, xf.group_id, x.id, yf.id, xf.id)q"""
    return execute_statements([(new_possible_crosses_sql, {'f_tags': list(f_tags)})],
                              username).get_as_list_of_dicts()


def get_possible_crosses(username):
    possible_crosses_sql = """SELECT * FROM (
        SELECT  concat(xf.id,'__', pc.male) as id,
            xf.id p1_fam_id,
            pc.male p2_fam_id,
            xf.group_id x_gid,
            yf.group_id y_gid,
            array_agg(distinct rtx.tag) f_tags,
            array_agg(distinct rty.tag) m_tags,
            (SELECT count(*) from family where parent_1 = ANY(array_agg(x.id))) x_crosses,
            (SELECT count(*) from family where parent_2 = ANY(array_agg(y.id))) y_crosses,
            requested_cross.id is not null as selected,
            array_remove(array_agg(y_crossed_tag.tag), NULL) as completed_y,
            array_remove(array_agg(x_crossed_tag.tag), NULL) as completed_x,
            pc.f,
            pc.di
                            FROM possible_cross as pc
                            JOIN animal as x ON pc.female = x.id
                            JOIN animal as y ON y.family = pc.male
                            JOIN family as xf ON x.family = xf.id
                            JOIN family as yf on yf.id = pc.male
                            JOIN refuge_tag rtx ON rtx.animal = x.id
                            JOIN refuge_tag rty on rty.animal = y.id
                       LEFT JOIN requested_cross ON xf.id = requested_cross.parent_f_fam AND pc.male = requested_cross.parent_m_fam
                       LEFT JOIN family next_gen_fam ON next_gen_fam.parent_1 = x.id and next_gen_fam.parent_2 = y.id
                       LEFT JOIN refuge_tag y_crossed_tag ON y_crossed_tag.animal = next_gen_fam.parent_2 AND next_gen_fam.id IS NOT NULL
                       LEFT JOIN refuge_tag x_crossed_tag ON x_crossed_tag.animal = next_gen_fam.parent_1 AND next_gen_fam.id IS NOT NULL
                           WHERE x.sex = 'F' AND y.sex = 'M'
                        GROUP BY xf.group_id, yf.group_id, pc.male, xf.id, requested_cross.id, pc.f, pc.di)q 
                           WHERE q.x_crosses <= 2 and q.y_crosses <= 2 ORDER BY f"""
    possible_crosses = execute_statements(possible_crosses_sql, username).get_as_list_of_dicts()

    possible_crosses_cnt_sql = """SELECT  count(*) FROM possible_cross"""
    possible_crosses_cnt = execute_statements(possible_crosses_cnt_sql, username).get_single_result()

    return possible_crosses, possible_crosses_cnt


def get_count_possible_females(username):
    possible_females_cnt_sql = """SELECT count(distinct female) from possible_cross"""
    return execute_statements(possible_females_cnt_sql, username).get_single_result()


def add_requested_cross(username, fam_f_id, fam_m_id, f):
    cross_id = uuid.uuid4()
    insert_requested_sql = f"""
        INSERT INTO requested_cross (id, parent_f_fam, parent_m_fam, f)
        VALUES ('{cross_id}','{fam_f_id}', '{fam_m_id}', {f})"""
    return execute_statements(insert_requested_sql, username, ResultType.RowCount).get_single_result()


def remove_requested_cross(username, fam_f_id, fam_m_id):
    insert_requested_sql = f"""
        DELETE FROM requested_cross
        WHERE parent_f = '{fam_f_id}' AND parent_m_fam = '{fam_m_id}'"""
    return execute_statements(insert_requested_sql, username, ResultType.RowCount).get_single_result()


def get_requested_crosses_csv(username, csv_file):
    req_crosses = get_requested_crosses(username)
    csv_file.write(
        f"Female Tags,Female Family,Male Tags,Male Family,Female Family Prev Cross Count,Male Family Prev Cross Count,f\n") # noqa
    prev_female = ""
    for cross in req_crosses:
        csv_file.write(f"\"{', '.join(cross['f_tags'])}\","
                       f"{cross['f_group_id']},"
                       f"\"{', '.join(cross['m_tags'])}\","
                       f"{cross['m_group_id']},"
                       f"{cross['x_cross_cnt']},"
                       f"{cross['y_cross_cnt']},"
                       f"{cross['f']}\n")
    return


def get_requested_crosses(username):
    requested_crosses_sql = """
    SELECT array_agg ((select tag from refuge_tag where animal = f_parent.id order by f_parent.id)) f_tags,
           f_family.group_id f_group_id,
           count(x_crosses) as x_cross_cnt,
           array(select distinct unnest(array_agg ((select tag from refuge_tag where animal = m_parent.id order by m_parent.id)))) m_tags,
           m_family.group_id m_group_id,
           count(y_crosses) as y_cross_cnt,
           requested_cross.f
       FROM requested_cross
       JOIN animal f_parent on f_parent.family = parent_f_fam
       JOIN animal m_parent ON m_parent.family = parent_m_fam
       JOIN family f_family on f_family.id = f_parent.family
       JOIN family m_family on m_family.id = parent_m_fam
       LEFT JOIN pedigree y_crosses ON y_crosses.parent = m_parent.id
       LEFT JOIN pedigree x_crosses ON x_crosses.parent = f_parent.id
       WHERE f_parent.id IN (SELECT DISTINCT female from possible_cross)
       GROUP BY (requested_cross.f, f_family.group_id, m_family.group_id) ORDER BY count(x_crosses), count(y_crosses), requested_cross.f;
    """
    return execute_statements(requested_crosses_sql, username).get_as_list_of_dicts()


def add_completed_cross(username, f_tag, m_tag, f):
    today = datetime.date.today()

    group_id_seq = f"""CREATE SEQUENCE IF NOT EXISTS group_id_{today.year}"""
    execute_statements(group_id_seq, username, ResultType.NoResult)

    insert_completed_sql = f"""
        INSERT INTO family (id, parent_1, parent_2, cross_date, group_id, di, f) 
        SELECT '{uuid.uuid4()}',
                f_tag.animal, 
                m_tag.animal, 
                to_date('{today.year}'::varchar, 'yyyy'), 
                nextval('group_id_{today.year}'),
                (f_fam.di + m_fam.di) / 2 + 1,
                {f}
          FROM refuge_tag f_tag 
          JOIN refuge_tag m_tag ON TRUE
          JOIN animal fa ON fa.id = f_tag.animal
          JOIN animal ma ON ma.id = m_tag.animal
          JOIN family f_fam ON f_fam.id = fa.family
          JOIN family m_fam ON m_fam.id = ma.family
         WHERE m_tag.tag = \'{m_tag}' AND f_tag.tag = \'{f_tag}\'"""
    if execute_statements(insert_completed_sql, username, ResultType.RowCount).row_cnts[0] < 1:
        LOGGER.error(f"Family record was not added for parents: {f_tag} and {m_tag}")
        return False

    return True


def insert_possible_crosses(username: str, possible_crosses: list):
    """
    Given a list of  possible crosses insert them
    :param username: Username responsible for the insert
    :param possible_crosses: List of possible crosses with f values calculated
    :return: Number of available females inserted

"""
    with get_connection(DEFAULT_DB_PARAMS, username=username) as conn:
        with conn.connection.cursor() as cursor:
            return insert_table_data('possible_cross', possible_crosses, cursor)


def cleanup_previous_available_females(username: str, female_tags: set):
    """
    Deletes previous females used for determining possible crosses if they are no longer in the given
    female_tags list.
    :param username: User responsible for removal of old possible female
    :param female_tags: Refuge tags of females to use to determine possible crosses
    :return:
    """
    # TODO: Also clean up this table when adding new males through manage fish
    delete_sql = ('DELETE FROM possible_cross USING refuge_tag WHERE not (tag = ANY(:f_tags)) AND female = animal',
                  {"f_tags": list(female_tags)})
    execute_statements(delete_sql, username, ResultType.NoResult)


def select_available_female_tags(username):
    results = execute_statements('SELECT distinct tag FROM possible_cross JOIN refuge_tag on animal = female',
                                 username).row_results
    f_tags = [row[0] for row in results]

    return ",".join(f_tags)


def determine_and_insert_possible_crosses(username_or_err, cleaned_f_tags):
    cleanup_previous_available_females(username_or_err, cleaned_f_tags)

    possible_crosses = get_new_possible_crosses_for_females(username_or_err, cleaned_f_tags)

    if len(possible_crosses):
        f_matrix = build_matrix_from_existing(username_or_err)
        for cross_idx, cross in enumerate(possible_crosses):
            cross['f'] = f_matrix.calculate_f_for_potential_cross(cross['female_fam'], cross['male'])
            cross['id'] = str(uuid.uuid4())
            cross.pop('female_fam')
        insert_cnt = insert_possible_crosses(username_or_err, possible_crosses)
    else:
        insert_cnt = 0

    return insert_cnt
