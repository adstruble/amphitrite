def get_group_id_from_parent(parent_gen_id, cross_year):
    group_id = int(parent_gen_id[2:5])
    if cross_year == 2007:
        group_id = int(parent_gen_id[3:5])
    return group_id
