import datetime

from amphi_logging.logger import get_logger
from db_utils.core import execute_statements, ResultType

LOGGER = get_logger('family')


def get_family_pedigree(username, cross_year):
    family_sql = f"""SELECT cf.id as child_fam_id, p1.family p1_fam_id, p2.family p2_fam_id
                    FROM family as cf
                    JOIN animal as p1 on cf.parent_1 = p1.id
                    JOIN animal as p2 on cf.parent_2 = p2.id WHERE cross_year = {cross_year}"""
    return execute_statements(family_sql, username).get_as_list_of_dicts()


def remove_family_by_tags(username, f_tag, m_tag):
    family_delete_from = "DELETE FROM family f " # noqa
    supplementation_family_delete_from = "DELETE FROM supplementation_family f " # noqa
    family_delete_condition = f"""
    USING refuge_tag rt_x
        JOIN refuge_tag rt_y ON rt_y.tag = :m_tag
    WHERE rt_x.tag = :f_tag
      AND f.parent_1 = rt_x.animal AND f.parent_2 = rt_y.animal
      AND cross_year = {datetime.date.today().year}"""
    sql_params = {'f_tag': f_tag, 'm_tag':  m_tag}
    row_cnts = execute_statements([(family_delete_from + family_delete_condition, sql_params),
                                   (supplementation_family_delete_from + family_delete_condition, sql_params)],
                                  username, ResultType.RowCount).row_cnts
    deleted_record_cnt = (row_cnts[0] + row_cnts[1])
    if deleted_record_cnt != 1:
        LOGGER.error(f"Expected to delete 1 family record. Deleted {deleted_record_cnt}")

    # Also unset the parents and cross_date on the requested cross
    update_req_cross_sql = f"""
    UPDATE requested_cross SET (parent_f, parent_m, cross_date) = (NULL, NULL, NULL) 
        FROM refuge_tag rtf
        JOIN refuge_tag rtm ON TRUE
        JOIN animal fa ON fa.id = rtf.animal
        JOIN animal ma ON ma.id = rtm.animal
       WHERE rtm.tag = \'{m_tag}' AND rtf.tag = \'{f_tag}\'
         AND parent_f = rtf.animal AND parent_m = rtm.animal"""
    execute_statements(update_req_cross_sql, username, ResultType.RowCount)

    return deleted_record_cnt


def set_family_mfg(username, params):
    table = 'family' if params['refuge_crosses'] else 'supplementation_family'
    sql = f"UPDATE {table} set mfg = :mfg where id = :fam_id"
    execute_statements((sql, params), username, ResultType.NoResult)


def get_ids_and_di_for_tag(tag: str, birth_year: int, username):
    return execute_statements(
        (f"""SELECT family.id as family, family.di, animal.id as animal
              FROM refuge_tag rt 
              JOIN animal on rt.animal = animal.id
              JOIN family on animal.family = family.id
             WHERE rt.tag = :tag AND cross_year = :cross_year""",
         {'tag': tag, 'cross_year': birth_year}), username).get_as_list_of_dicts()


def save_family_notes(username: str, table_name, query_params):
    sql = (f"INSERT INTO {table_name}_note AS an "
           f"(id, family, content) VALUES (gen_random_uuid (), :fam_id, :notes) "
           f"ON CONFLICT (family) DO UPDATE SET content = EXCLUDED.content")
    execute_statements((sql, query_params), username, ResultType.NoResult)
    return {"success": True}
