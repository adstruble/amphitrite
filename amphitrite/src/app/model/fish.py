import logging

from amphi_logging.logger import get_logger
from db_utils import db_connection
from db_utils.core import execute_statements, ResultType
from db_utils.db_connection import DEFAULT_DB_PARAMS

LOGGER = get_logger('model')


class Fish:
    sex = 'f'
    box = -1,
    spawn_year = 0
    alive = False
    family_id = None
    id = -1


def get_fishes_from_db(username: str, query_params: dict, order_by_clause: str):
    """

    :param username: user to execute the query as
    :param query_params: Params for executing the query (limit, offset, filter)
    :param order_by_clause: SQL clause for ordering
    :return: a tuple of size containing, fish and count of fish without limit
    """
    filter_str = ""
    filter_val = query_params.get('filter')
    if filter_val:
        like_filter = "LIKE '%' || :filter || '%'"
        filter_str = f" WHERE box::text {like_filter} " \
                     f"OR group_id::text {like_filter} " \
                     f"OR (group_id = -1 AND 'UNKNOWN' {like_filter}) " \
                     f"OR tag {like_filter} " \
                     f"OR sex::text {like_filter} " \
                     f"OR date(cross_date)::text {like_filter}"

    LOGGER.info(f"Query params: {query_params}")
    fish = execute_statements((f"""SELECT fish.id as id, group_id, date(cross_date) as cross_date, sex, tag, box
                                   FROM fish 
                                   LEFT JOIN family ON fish.family = family.id
                                   JOIN refuge_tag on fish.id = refuge_tag.fish
                                    {filter_str}
                                    {order_by_clause} OFFSET :offset LIMIT :limit""",
                               query_params), username).get_as_list_of_dicts()

    fish_cnt = execute_statements(('SELECT count(fish.id) '
                                   '  FROM fish '
                                   '  LEFT JOIN family ON fish.family = family.id'
                                   f' JOIN refuge_tag on fish.id = refuge_tag.fish {filter_str}', query_params),
                                  username).get_single_result()

    return fish, fish_cnt
