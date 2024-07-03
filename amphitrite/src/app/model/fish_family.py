from db_utils.core import execute_statements


def get_family_pedigree(username):
    family_sql = """SELECT cf.id as child_fam_id, p1.family p1_fam_id, p2.family p2_fam_id
                    FROM family as cf
                    JOIN animal as p1 on cf.parent_1 = p1.id
                    JOIN animal as p2 on cf.parent_2 = p2.id ORDER by cf.cross_date"""
    family_pedigree = execute_statements(family_sql ,username).get_as_list_of_dicts()
    return family_pedigree


def get_possible_crosses(username):
    possible_crosses_sql = """SELECT  p1.family p1_fam_id, p2.family p2_fam_id
                    FROM animal as p1 
                    JOIN animal as p2 ON TRUE 
                    WHERE p1.sex = 'F' AND p2.sex = 'M' GROUP BY p1.family, p2.family"""
    possible_crosses = execute_statements(possible_crosses_sql ,username).get_as_list_of_dicts()
    return possible_crosses
