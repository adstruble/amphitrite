import uuid
import datetime

from amphi_logging.logger import get_logger
from db_utils.core import execute_statements, ResultType

LOGGER = get_logger('cross-fish')


def get_possible_crosses(username):
    possible_crosses_sql = """SELECT * FROM (
        SELECT  concat(x.id,'__', yf.id) as id,
            xf.id p1_fam_id,
            yf.id p2_fam_id,
            xf.group_id x_gid,
            yf.group_id y_gid,
            rtx.tag f_tag,
            array_agg(distinct rty.tag) m_tags,
            (SELECT count(*) from pedigree where parent = ANY(select id FROM animal WHERE family = xf.id)) x_crosses,
            (SELECT count(*) from pedigree where parent = ANY(array_agg(y.id))) y_crosses,
            requested_cross.id is not null as selected,
            array_agg(y_crossed_tag.tag) as completed
                            FROM animal as x
                            JOIN animal as y ON TRUE
                            JOIN family as xf ON x.family = xf.id
                            JOIN family as yf ON y.family = yf.id
                            JOIN refuge_tag rtx ON rtx.animal = x.id
                            JOIN refuge_tag rty on rty.animal = y.id
                       LEFT JOIN requested_cross ON x.id = requested_cross.parent_f AND yf.id = requested_cross.parent_m_fam
                       LEFT JOIN family next_gen_fam ON next_gen_fam.parent_1 = x.id and next_gen_fam.parent_2 = y.id
                       LEFT JOIN refuge_tag y_crossed_tag ON y_crossed_tag.animal = next_gen_fam.parent_2 AND next_gen_fam.id IS NOT NULL
                           WHERE x.sex = 'F' AND y.sex = 'M'
                        GROUP BY rtx.tag, xf.group_id, x.id, yf.id, xf.id, requested_cross.id)q 
                           WHERE q.x_crosses <= 2 and q.y_crosses <= 2 LIMIT 50"""
    possible_crosses = execute_statements(possible_crosses_sql, username).get_as_list_of_dicts()

    possible_crosses_cnt_sql = """SELECT  count(*) from (select p1.family
                    FROM animal as p1
                    JOIN animal as p2 ON TRUE
                    WHERE p1.sex = 'F' AND p2.sex = 'M' GROUP BY p1.family, p2.family)q"""
    possible_crosses_cnt = execute_statements(possible_crosses_cnt_sql, username).get_single_result()

    return possible_crosses, possible_crosses_cnt


def add_requested_cross(username, fish_f_id, fam_m_id, f):
    cross_id = uuid.uuid4()
    insert_requested_sql = f"""
        INSERT INTO requested_cross (id, parent_f, parent_m_fam, f)
        VALUES ('{cross_id}','{fish_f_id}', '{fam_m_id}', {f})"""
    return execute_statements(insert_requested_sql, username, ResultType.RowCount).get_single_result()


def remove_requested_cross(username, fish_f_id, fam_m_id):
    insert_requested_sql = f"""
        DELETE FROM requested_cross
        WHERE parent_f = '{fish_f_id}' AND parent_m_fam = '{fam_m_id}'"""
    return execute_statements(insert_requested_sql, username, ResultType.RowCount).get_single_result()


def get_requested_crosses_csv(username, csv_file):
    req_crosses = get_requested_crosses(username)
    csv_file.write(f"Female Tag, Female Family, Male Tags, Male Family, Male Family Prev Cross Count\n")
    prev_female = ""
    for cross in req_crosses:
        if cross['f_tag'] == prev_female:
            cross['f_tag'] = ''
            cross['f_group_id'] = ''
        else:
            prev_female = cross['f_tag']
        csv_file.write(f"{cross['f_tag']},{cross['f_group_id']},{' '.join(cross['m_tags'])},{cross['m_group_id']},{cross['y_cross_cnt']}\n")
    return


def get_requested_crosses(username):
    requested_crosses_sql = """
    SELECT f_tag.tag as f_tag,
           f_family.group_id f_group_id,
           array_agg ((select tag from refuge_tag where animal = m_parent.id order by m_parent.id)) m_tags,
           m_family.group_id m_group_id,
           count(y_crosses) as y_cross_cnt
       FROM requested_cross
       JOIN animal f_parent on f_parent.id = parent_f
       JOIN animal m_parent ON m_parent.family = parent_m_fam
       JOIN family f_family on f_family.id = f_parent.family
       JOIN family m_family on m_family.id = parent_m_fam
       JOIN refuge_tag f_tag ON animal = f_parent.id
       LEFT JOIN pedigree y_crosses ON parent = m_parent.id
       GROUP BY (f_parent.id, tag, requested_cross.f, f_family.group_id, m_family.group_id) ORDER BY tag, count(y_crosses), requested_cross.f;
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
