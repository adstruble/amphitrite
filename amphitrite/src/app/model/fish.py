from amphi_logging.logger import get_logger
from db_utils.core import execute_statements, ResultType

LOGGER = get_logger('model')


class Fish:
    sex = 'f'
    box = -1,
    spawn_year = 0
    alive = False
    family_id = None
    id = -1


def save_fish_notes(username: str, query_params):
    sql = ("INSERT INTO animal_note as an (id, animal, content) VALUES (gen_random_uuid (), :fish_id, :notes) "
           "ON CONFLICT (animal) DO UPDATE SET content = EXCLUDED.content WHERE an.animal = EXCLUDED.animal")
    execute_statements((sql, query_params), username, ResultType.NoResult)
    return {"success": True}


def get_fishes_from_db(username: str, query_params: dict, order_by_clause: str):
    """

    :param username: user to execute the query as
    :param query_params: Params for executing the query (limit, offset, filter)
    :param order_by_clause: SQL clause for ordering
    :return: a tuple of size containing, fish and count of fish without limit
    """
    filter_str = " WHERE NOT wt"
    if query_params.get('like_filter'):
        like_filter = "LIKE :like_filter || '%'"
        filter_str = f" {filter_str} AND (box::text {like_filter} " \
                     f"OR group_id::text {like_filter} " \
                     f"OR (group_id < 0 AND 'UNKNOWN' {like_filter}) " \
                     f"OR tag {like_filter} " \
                     f"OR sex::text {like_filter} " \
                     f"OR date(cross_date)::text {like_filter})" \
                     f"OR an.content {like_filter}"
    exact_filter = query_params.get('exact_filters')
    if exact_filter:
        exact_filters = [f"{key} = :{key}" for key in exact_filter]
        filter_str = f" {filter_str} AND ({' AND '.join(exact_filters)})"
        query_params.update(query_params.get('exact_filters'))

    LOGGER.info(f"Query params: {query_params}")
    fish = execute_statements((
        f"""SELECT a.id as id, 
                   CASE WHEN group_id < 0 THEN 'FROM WILD' ELSE group_id::text END,
                   date(cross_date) as cross_date,
                   COALESCE(tag, 'UNKNOWN') as tag,
                   sex,
                   f,
                   di,
                   box,
                   coalesce(an.content,'') as notes,
                   alive
                FROM animal a
                JOIN family ON a.family = family.id
                LEFT JOIN refuge_tag on a.id = refuge_tag.animal
                LEFT JOIN animal_note an on a.id = an.animal
                {filter_str}
                {order_by_clause} OFFSET :offset LIMIT :limit""",
        query_params), username=username).get_as_list_of_dicts()

    fish_cnt = execute_statements(('SELECT count(animal.id) '
                                   '  FROM animal '
                                   '  LEFT JOIN family ON animal.family = family.id'
                                   '  LEFT JOIN refuge_tag on animal.id = refuge_tag.animal'
                                   f' LEFT JOIN public.animal_note an on animal.id = an.animal {filter_str}', query_params), # noqa
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
    :param username
    :param fish_ids: list of fish ids to get f values for
    :return: the f values for the given fish
    """

    ids_str = ', '.join([f"'{f}'" for f in fish_ids])

    return execute_statements(
        f"""SELECT animal.id as id, f
                FROM animal 
                JOIN family ON animal.family = family.id
                WHERE animal.id in ({ids_str})""", username).get_as_list_of_dicts()


def mark_all_fish_dead(username):
    return execute_statements("UPDATE animal set alive = false", username, # noqa
                             result_type=ResultType.NoResult)


def mark_fish_dead(username, dead_fish):
    marked_fish = execute_statements(
        ("UPDATE animal da set alive = false "
         "FROM refuge_tag rt "
         "WHERE tag = ANY(:dead_fish) AND year = date_part('year', CURRENT_DATE) AND da.id = rt.animal",
         {"dead_fish": dead_fish}), username, result_type=ResultType.RowCount).row_cnts[0]

    if marked_fish > 0:
        # Reset possible_cross table since fish might now be dead
        execute_statements(["TRUNCATE possible_cross"], username, ResultType.NoResult)

    return marked_fish
