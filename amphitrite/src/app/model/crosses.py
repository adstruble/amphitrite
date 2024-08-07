import tempfile
import uuid

from flask import send_file

from db_utils.core import execute_statements, ResultType


def get_possible_crosses(username):
    possible_crosses_sql = """SELECT * FROM (
    SELECT  concat(x.id,'__', yf.id) as id,
        xf.id p1_fam_id,
        yf.id p2_fam_id,
        xf.group_id x_gid,
        yf.group_id y_gid,
        rtx.tag x_tag,
        array_agg(distinct rty.tag) y_tags,
        (select count(*) from pedigree where parent = ANY(array_agg(x.id))) x_crosses,
        (select count(*) from pedigree where parent = ANY(array_agg(y.id))) y_crosses,
        public.requested_cross.id is not null as selected
                        FROM animal as x
                        JOIN animal as y ON TRUE
                        JOIN family as xf ON x.family = xf.id
                        JOIN family as yf ON y.family = yf.id
                        JOIN refuge_tag rtx ON rtx.animal = x.id
                        JOIN refuge_tag rty on rty.animal = y.id
                        LEFT JOIN requested_cross ON x.id = requested_cross.parent_f AND yf.id = requested_cross.parent_m_fam
                        WHERE x.sex = 'F' AND y.sex = 'M'
                        GROUP BY rtx.tag, xf.group_id, x.id, yf.id, xf.id, requested_cross.id)q where q.x_crosses <= 2 and q.y_crosses <= 2 LIMIT 50"""
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
       GROUP BY (f_parent.id, tag, requested_cross.f, f_family.group_id, m_family.group_id) ORDER BY tag, count(y_crosses) ASC , requested_cross.f ASC;
    """
    return execute_statements(requested_crosses_sql, username).get_as_list_of_dicts()