from db_utils.core import execute_statements


def get_family_pedigree(username, cross_year):
    family_sql = f"""SELECT cf.id as child_fam_id, p1.family p1_fam_id, p2.family p2_fam_id
                    FROM family as cf
                    JOIN animal as p1 on cf.parent_1 = p1.id
                    JOIN animal as p2 on cf.parent_2 = p2.id WHERE cross_year = {cross_year}"""
    return execute_statements(family_sql, username).get_as_list_of_dicts()


