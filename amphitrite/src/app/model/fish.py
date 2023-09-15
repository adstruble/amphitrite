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


def get_fishes_from_db(username: str, query_params: dict):
    """

    :param username: user to execute the query as
    :param query_params: Params for executing the query (limit,
    :return:
    """
    order_direction = 'DESC' if query_params.pop("DESC") else 'ASC'
    LOGGER.info(f"Query params: {query_params}")
    return execute_statements(('SELECT fish.id , group_id, sex, tag, box '
                               '  FROM fish '
                               '  JOIN family ON fish.family = family.id'
                               '  JOIN refuge_tag on fish.id = refuge_tag.fish'
                              f' ORDER BY {query_params["order_by"]} {order_direction} OFFSET :offset LIMIT :limit',
                               query_params), username).get_as_list_of_dicts()
