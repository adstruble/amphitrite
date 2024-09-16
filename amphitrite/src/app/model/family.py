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
    family_delete_sql = f"""
    DELETE FROM family
    USING refuge_tag rt_x
        JOIN refuge_tag rt_y ON rt_y.tag = :m_tag
    WHERE rt_x.tag = :f_tag
      AND family.parent_1 = rt_x.animal AND family.parent_2 = rt_y.animal
      AND cross_year = {datetime.date.today().year}"""

    deleted_record_cnt = execute_statements((family_delete_sql, {'f_tag': f_tag, 'm_tag':  m_tag}),
                                            username, ResultType.RowCount).row_cnts[0]
    if deleted_record_cnt != 1:
        LOGGER.error(f"Expected to delete 1 family record. Deleted {deleted_record_cnt}")

    return deleted_record_cnt
