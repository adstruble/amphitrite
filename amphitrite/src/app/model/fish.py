import logging

from amphi_logging.logger import get_logger
from db_utils import db_connection
from db_utils.core import execute_statements, ResultType
from db_utils.db_connection import DEFAULT_DB_PARAMS, get_connection
from db_utils.insert import insert_table_data

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
    filter_str = " WHERE NOT wt"
    filter_val = query_params.get('filter')
    if filter_val:
        like_filter = "LIKE :filter || '%'"
        filter_str = f" {filter_str} AND (box::text {like_filter} " \
                     f"OR group_id::text {like_filter} " \
                     f"OR (group_id < 0 AND 'UNKNOWN' {like_filter}) " \
                     f"OR tag {like_filter} " \
                     f"OR sex::text {like_filter} " \
                     f"OR date(cross_date)::text {like_filter})"

    LOGGER.info(f"Query params: {query_params}")
    fish = execute_statements((
        f"""SELECT animal.id as id, 
                   CASE WHEN group_id < 0 THEN 'FROM WILD' ELSE group_id::text END,
                   date(cross_date) as cross_date,
                   COALESCE(tag, 'UNKNOWN') as tag,
                   sex,
                   f,
                   di,
                   box
                FROM animal 
                JOIN family ON animal.family = family.id
                LEFT JOIN refuge_tag on animal.id = refuge_tag.animal
                {filter_str}
                {order_by_clause} OFFSET :offset LIMIT :limit""",
        query_params), username).get_as_list_of_dicts()

    fish_cnt = execute_statements(('SELECT count(animal.id) '
                                   '  FROM animal '
                                   '  LEFT JOIN family ON animal.family = family.id'
                                   f' LEFT JOIN refuge_tag on animal.id = refuge_tag.animal {filter_str}', query_params), # noqa
                                  username).get_single_result()

    return fish, fish_cnt


def get_fish_available_for_crossing(sex,  username):
    return execute_statements((
        f"""SELECT animal.id as id, family.f, sex
                FROM animal 
                JOIN family ON animal.family = family.id
                LEFT JOIN family prev_cross ON prev_cross.parent_1 = animal.id or prev_cross.parent_2 = animal.id 
                WHERE sex = :sex and prev_cross.id is NULL""", {'sex', sex}),
        username).get_as_list_of_dicts()


def get_fish_f_values(fish_ids: list, username):
    """
    :param fish_ids: list of fish ids to get f values for
    :return: the f values for the given fish
    """

    ids_str = ', '.join([f"'{f}'" for f in fish_ids])

    return execute_statements(
        f"""SELECT animal.id as id, f
                FROM animal 
                JOIN family ON animal.family = family.id
                WHERE animal.id in ({ids_str})""", username).get_as_list_of_dicts()


def insert_possible_crosses(username: str, possible_crosses: list, female_tags: set):
    """
    Given a list of  possible crosses insert them
    :param username: Username responsible for the insert
    :param possible_crosses: List of possible crosses with f values calculated
    :param female_tags: If possible crosses exist not for the given female_tags delete them.
    :return: Number of available females inserted

"""
    # TODO: Clean up this table when adding new males
    stmts = [('DELETE FROM possible_cross USING refuge_tag WHERE not (tag = ANY(:f_tags)) AND female = animal'), # noqa
             {"f_tags": list(female_tags)}]
    with get_connection(DEFAULT_DB_PARAMS, username=username) as conn:
        with conn.connection.cursor() as cursor:
            return insert_table_data('possible_cross', possible_crosses, cursor)


def select_available_female_tags(username):
    results = execute_statements('SELECT distinct tag FROM possible_cross JOIN refuge_tag on animal = female',
                                 username).row_results
    f_tags = [row[0] for row in results]

    return ",".join(f_tags)
