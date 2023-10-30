import logging


def validate_order_by(order_bys: list, valid_values, default=None):
    """
    Checks if given param value is one of given valid_values. If so, it will return it. If not, returns the
    default, if default is not given, None is returned
    :param order_bys: OrderBys to check for validity
    :param valid_values: possible valid values
    :param default:
    :return: param is value is valid, otherwise default if it is given, otherwise None
    """
    order_by_clause = "ORDER BY "
    order_by_cols = ""
    for order_by in order_bys:
        logging.info(f"order by: {order_by}END")
        col, direction = order_by.split(",")
        if col not in valid_values or not (direction == 'ASC' or direction == 'DESC'):
            return f"{order_by_clause} {default}"
        order_by_cols = f"{order_by_cols}{col} {direction}, "
    if not order_by_cols:
        return f"{order_by_clause} {default}"
    return f"{order_by_clause} {order_by_cols[:-2]}"
