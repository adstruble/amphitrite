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
    :param query_params: Params for executing the query (limit, offset)
    :param order_by_clause: SQL clause for ordering
    :return: a tuple of size containing, fish and count of fish without limit
    """
    LOGGER.info(f"Query params: {query_params}")
    fish = execute_statements(('SELECT fish.id as id, group_id as group_id, sex as sex, tag as tag, box as box'
                               '  FROM fish '
                               '  JOIN family ON fish.family = family.id'
                               '  JOIN refuge_tag on fish.id = refuge_tag.fish'
                              f' {order_by_clause} OFFSET :offset LIMIT :limit',
                               query_params), username).get_as_list_of_dicts()

    fish_cnt = execute_statements(('SELECT count(fish.id) '
                                   '  FROM fish '
                                   '  JOIN family ON fish.family = family.id'
                                   '  JOIN refuge_tag on fish.id = refuge_tag.fish'), username).get_single_result()

    return fish, fish_cnt
