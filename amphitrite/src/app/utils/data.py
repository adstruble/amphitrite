from blueprints.utils import LOGGER


def get_group_id_from_parent(parent_gen_id, cross_year):
    group_id = int(parent_gen_id[2:5])
    if cross_year == 2007:
        group_id = int(parent_gen_id[3:5])
    return group_id


def validate_order_by(order_bys: list, valid_values, default=None):
    """
    Checks if given param value is one of given valid_values. If so, it will return it. If not, returns the
    default, if default is not given, None is returned
    :param order_bys: OrderBys to check for validity
    :param valid_values: possible valid values
    :param default:
    :return: param is value is valid, otherwise default if it is given, otherwise None
    """
    order_by_cols = ""
    for order_by in order_bys:
        col, direction = order_by.split(",")
        if col not in valid_values or not (direction == 'ASC' or direction == 'DESC'):
            continue
        if col == 'group_id':
            col = 'group_id::integer'
        order_by_cols = f"{order_by_cols}{col} {direction}, "
    if not order_by_cols:
        LOGGER.info(f"Using default order by: {default}")
        return f"ORDER BY {default}"
    return f"ORDER BY {order_by_cols[:-2]}"
