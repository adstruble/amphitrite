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


def get_fishes_from_db(username: str, query_params: dict, order_by_clause: str, include_cnt=True,
                       include_genotype=False):
    """

    :param username: user to execute the query as
    :param query_params: Params for executing the query (limit, offset, filter)
    :param order_by_clause: SQL clause for ordering
    :param include_cnt: If True include the count of the records the query returns in the results without the limit
    and offset
    :param include_genotype: If true, include the genotype field in the query results
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
        if 'ids' in exact_filter:
            query_params['ids'] = query_params.pop('exact_filters')['ids']
            filter_str = f" WHERE a.id::text = ANY(:ids)"
        else:
            exact_filters = [f"{key} = :{key}" for key in exact_filter]
            filter_str = f" {filter_str} AND ({' AND '.join(exact_filters)})"
            query_params.update(query_params.get('exact_filters'))

    LOGGER.info(f"filter_str: {filter_str}")
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
                   alive {', genotype ' if include_genotype else ''}
                FROM animal a
                JOIN family ON a.family = family.id
                LEFT JOIN refuge_tag on a.id = refuge_tag.animal
                LEFT JOIN animal_note an on a.id = an.animal
                {filter_str}
                {order_by_clause} OFFSET :offset LIMIT :limit""",
        query_params), username=username).get_as_list_of_dicts()

    fish_cnt = -1
    if include_cnt:
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


def get_fish_csv(username, query_params, csv_file):

    allele_cols = []
    wrote_one = False
    for col in query_params['export_columns']:
        if not col['selected']:
            continue
        if col['name'] == 'Alleles':
            allele_cols = ["Htr-GVL-001_0", "Htr-GVL-001_1", "Htr-GVL-002_0", "Htr-GVL-002_1", "Htr-GVL-003_0", "Htr-GVL-003_1", "Htr-GVL-004_0", "Htr-GVL-004_1", "Htr-GVL-005_0", "Htr-GVL-005_1", "Htr-GVL-006_0", "Htr-GVL-006_1", "Htr-GVL-007_0", "Htr-GVL-007_1", "Htr-GVL-008_0", "Htr-GVL-008_1", "Htr-GVL-009_0", "Htr-GVL-009_1", "Htr-GVL-010_0", "Htr-GVL-010_1", "Htr-GVL-011_0", "Htr-GVL-011_1", "Htr-GVL-012_0", "Htr-GVL-012_1", "Htr-GVL-013_0", "Htr-GVL-013_1", "Htr-GVL-014_0", "Htr-GVL-014_1", "Htr-GVL-015_0", "Htr-GVL-015_1", "Htr-GVL-016_0", "Htr-GVL-016_1", "Htr-GVL-017_0", "Htr-GVL-017_1", "Htr-GVL-018_0", "Htr-GVL-018_1", "Htr-GVL-019_0", "Htr-GVL-019_1", "Htr-GVL-020_0", "Htr-GVL-020_1", "Htr-GVL-021_0", "Htr-GVL-021_1", "Htr-GVL-022_0", "Htr-GVL-022_1", "Htr-GVL-023_0", "Htr-GVL-023_1", "Htr-GVL-024_0", "Htr-GVL-024_1", "Htr-GVL-025_0", "Htr-GVL-025_1", "Htr-GVL-026_0", "Htr-GVL-026_1", "Htr-GVL-027_0", "Htr-GVL-027_1", "Htr-GVL-028_0", "Htr-GVL-028_1", "Htr-GVL-029_0", "Htr-GVL-029_1", "Htr-GVL-030_0", "Htr-GVL-030_1", "Htr-GVL-031_0", "Htr-GVL-031_1", "Htr-GVL-032_0", "Htr-GVL-032_1", "Htr-GVL-033_0", "Htr-GVL-033_1", "Htr-GVL-034_0", "Htr-GVL-034_1", "Htr-GVL-035_0", "Htr-GVL-035_1", "Htr-GVL-036_0", "Htr-GVL-036_1", "Htr-GVL-037_0", "Htr-GVL-037_1", "Htr-GVL-038_0", "Htr-GVL-038_1", "Htr-GVL-039_0", "Htr-GVL-039_1", "Htr-GVL-040_0", "Htr-GVL-040_1", "Htr-GVL-041_0", "Htr-GVL-041_1", "Htr-GVL-042_0", "Htr-GVL-042_1", "Htr-GVL-043_0", "Htr-GVL-043_1", "Htr-GVL-044_0", "Htr-GVL-044_1", "Htr-GVL-045_0", "Htr-GVL-045_1", "Htr-GVL-046_0", "Htr-GVL-046_1", "Htr-GVL-047_0", "Htr-GVL-047_1", "Htr-GVL-048_0", "Htr-GVL-048_1", "Htr-GVL-049_0", "Htr-GVL-049_1", "Htr-GVL-050_0", "Htr-GVL-050_1", "Htr-GVL-051_0", "Htr-GVL-051_1", "Htr-GVL-052_0", "Htr-GVL-052_1", "Htr-GVL-053_0", "Htr-GVL-053_1", "Htr-GVL-054_0", "Htr-GVL-054_1", "Htr-GVL-055_0", "Htr-GVL-055_1", "Htr-GVL-056_0", "Htr-GVL-056_1", "Htr-GVL-057_0", "Htr-GVL-057_1", "Htr-GVL-058_0", "Htr-GVL-058_1", "Htr-GVL-059_0", "Htr-GVL-059_1", "Htr-GVL-060_0", "Htr-GVL-060_1", "Htr-GVL-061_0", "Htr-GVL-061_1", "Htr-GVL-062_0", "Htr-GVL-062_1", "Htr-GVL-063_0", "Htr-GVL-063_1", "Htr-GVL-064_0", "Htr-GVL-064_1", "Htr-GVL-065_0", "Htr-GVL-065_1", "Htr-GVL-066_0", "Htr-GVL-066_1", "Htr-GVL-067_0", "Htr-GVL-067_1", "Htr-GVL-068_0", "Htr-GVL-068_1", "Htr-GVL-069_0", "Htr-GVL-069_1", "Htr-GVL-070_0", "Htr-GVL-070_1", "Htr-GVL-071_0", "Htr-GVL-071_1", "Htr-GVL-072_0", "Htr-GVL-072_1", "Htr-GVL-073_0", "Htr-GVL-073_1", "Htr-GVL-074_0", "Htr-GVL-074_1", "Htr-GVL-075_0", "Htr-GVL-075_1"] # noqa
            csv_file.write(f"{',' if wrote_one else ''}{','.join(allele_cols)}") # noqa
        else:
            csv_file.write(f"{',' if wrote_one else ''}{col['name']}") # noqa
        wrote_one = True
    csv_file.write("\n")

    fishes, _ = get_fishes_from_db(username, query_params, "", include_cnt=False,
                                   include_genotype=(len(allele_cols) > 0))
    for fish in fishes:
        wrote_one = False
        for col in query_params['export_columns']:
            if not col['selected']:
                continue
            if col['name'] == 'Alleles':
                if not fish['genotype']:
                    # We don't have genotype data for older fish, put in commas
                    csv_file.write(f"{',' if wrote_one else ''}")
                    for _ in allele_cols[1:]:
                        csv_file.write(",")
                else:
                    for allele_val in fish['genotype']:
                        csv_file.write(f"{',' if wrote_one else ''}{allele_val}") # noqa
            else:
                if col['name'] == 'Notes':
                    csv_file.write(f"{',' if wrote_one else ''}\"{fish[col['field']]}\"")
                else:
                    csv_file.write(f"{',' if wrote_one else ''}{fish[col['field']]}") # noqa
            wrote_one = True
        csv_file.write("\n")



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
