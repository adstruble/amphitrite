import math

from blueprints.utils import LOGGER


def get_group_id_from_parent(parent_gen_id, cross_year):
    group_id = int(parent_gen_id[2:5])
    if cross_year == 2007:
        group_id = int(parent_gen_id[3:5])
    return group_id


def get_generation_id(parents_cross_year, child_group_id, sex):
    # Need to adjust for cross years 2007 - 2015 starting with 10 - 90 before switching to
    # 11 and then sequential. i.e. years that start with N0 are already taken.
    parents_cross_year = int(parents_cross_year)
    cross_year_adjustment = int(2229 - math.floor(parents_cross_year / 9))
    return (f"{str(parents_cross_year - cross_year_adjustment).ljust(2, '0')}" +
            f"{'xxx' if not child_group_id else str(child_group_id).zfill(3)}"
            f"{1 if sex == 'F' else 2}")

# Parents cross year : generation ids
# 2007 : 10
# 2008 : 20
# 2009 : 30
# 2010 : 40
# 2011 : 50
# 2012 : 60
# 2013 : 70
# 2014 : 80
# 2015 : 90
# 2016 : 11
# 2017 : 12
# 2018 : 13
# 2019 : 14
# 2020 : 15
# 2021 : 16
# 2022 : 17
# 2023 : 14
# 2024 : 19
# 2025 : 21****


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
        if col.endswith('group_id'):
            col = f'{col}::integer'
        order_by_cols = f"{order_by_cols}{col} {direction}, "
    if not order_by_cols:
        LOGGER.info(f"Using default order by: {default}")
        return f"ORDER BY {default}"
    return f"ORDER BY {order_by_cols[:-2]}"
