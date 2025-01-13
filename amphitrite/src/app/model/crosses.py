import uuid
import datetime

from algorithms.f_calculation import build_matrix_from_existing
from amphi_logging.logger import get_logger
from db_utils.core import execute_statements, ResultType
from db_utils.db_connection import get_connection, DEFAULT_DB_PARAMS, make_connection_kwargs
from db_utils.insert import insert_table_data

LOGGER = get_logger('cross-fish')


def clear_requested_crosses(username):
    # If this is a new breeding year we want to clear out all the requested crosses
    execute_statements(["""DELETE FROM requested_cross WHERE EXISTS (
                        SELECT 1 FROM public.requested_cross
                                WHERE date_part('year', cross_date) < date_part('year', CURRENT_DATE))"""],
                       username, ResultType.NoResult)


def get_new_possible_crosses_for_females(username, f_tags):
    clear_requested_crosses(username)

    new_possible_crosses_sql = """SELECT * FROM (
    SELECT  xf.id female_fam,
            yf.id male,
            x.id female,
            (xf.di + yf.di) / 2 + 1 di
    FROM refuge_tag rtx
            JOIN animal as x on x.id = rtx.animal
            JOIN animal as y ON TRUE
            JOIN family as xf ON x.family = xf.id
            JOIN family as yf ON y.family = yf.id
                             AND yf.id NOT IN (SELECT family FROM animal
                                                             JOIN refuge_tag ON animal.id = refuge_tag.animal
                                                                            AND tag = ANY(:f_tags)
                                                                            AND year = date_part('year', CURRENT_DATE))
            JOIN refuge_tag rty ON rty.animal = y.id
       LEFT JOIN possible_cross pc ON pc.female = rtx.animal
       --LEFT JOIN family next_gen_fam ON next_gen_fam.parent_1 = ANY(SELECT id FROM animal WHERE family = xf.id) 
       --                             AND next_gen_fam.parent_2 = ANY(SELECT id FROM animal WHERE family = yf.id)
      -- LEFT JOIN family next_gen_fam2 ON next_gen_fam2.parent_2 = ANY(SELECT id FROM animal WHERE family = xf.id) 
      --                              AND  next_gen_fam2.parent_1 = ANY(SELECT id FROM animal WHERE family = yf.id)
           WHERE x.sex = 'F' AND y.sex = 'M' AND x.alive AND y.alive AND pc.id is NULL AND rtx.tag = ANY (:f_tags)
           AND rtx.year = date_part('year', CURRENT_DATE)

    GROUP BY rtx.id, x.id, yf.id, xf.id)q"""
    return execute_statements([(new_possible_crosses_sql, {'f_tags': list(f_tags)})],
                              username).get_as_list_of_dicts()


def get_num_fam_crosses_completed (this_fam_id):
    return f"""(SELECT count(distinct rc.id) FROM requested_cross rc
    WHERE (rc.parent_m_fam = {this_fam_id} OR rc.parent_f_fam = {this_fam_id}) AND NOT rc.supplementation) +
        (SELECT count(*) FROM family newf
                         JOIN animal a ON a.id = newf.parent_2 OR a.id = newf.parent_1
                    LEFT JOIN requested_cross rc ON (rc.parent_m = newf.parent_2 OR rc.parent_f = newf.parent_1)
                         OR rc.supplementation
         WHERE a.family = {this_fam_id} AND rc.id IS null AND newf.cross_year = date_part('year', CURRENT_DATE))"""


def get_tag_crossed(male: bool):
    return f"""SELECT concat(tag, '_ref') FROM family ngf
            JOIN animal m on ngf.parent_2 = m.id and m.family = pc.male
            JOIN animal f ON ngf.parent_1 = f.id and f.family = xf.id
            JOIN refuge_tag rt ON rt.animal = {"m.id" if male else "f.id"}
            UNION
            SELECT concat(rt.tag, '_sup') FROM public.supplementation_family ngf
            JOIN animal m on ngf.parent_2 = m.id and m.family = pc.male
            JOIN animal f ON ngf.parent_1 = f.id and f.family = xf.id
            JOIN refuge_tag rt ON rt.animal = {"m.id" if male else "f.id"} LIMIT 1"""


def get_possible_crosses(username, query_params):

    filter_str = ""
    if query_params.get('like_filter'):
        filter_str = f" AND ("
        like_filter = "LIKE :like_filter || '%'"
        filter_str += f"rty.tag {like_filter} OR rtx.tag {like_filter} OR "
        filter_str += f"xf.group_id::text {like_filter} OR yf.group_id::text {like_filter})"

    exact_filter = query_params.get('exact_filters')
    exact_filters = []
    for idx, (key, value) in enumerate(exact_filter.items()):
        if key == 'f_tag' or key == 'm_tag':
            exact_filters.append(f":ef_{idx} = ANY({key}s)")
        else:
            exact_filters.append(f"{key} = :ef_{idx}")
        query_params[f"ef_{idx}"] = value
    if exact_filters:
        filter_str = f" {filter_str} AND ({' AND '.join(exact_filters)})"

    y_crosses_sql = get_num_fam_crosses_completed('pc.male')
    x_crosses_sql = get_num_fam_crosses_completed('xf.id')

    columns_sql = f"""SELECT * FROM (
        SELECT  concat(xf.id,'__', pc.male) as id,
            xf.id p1_fam_id,
            pc.male p2_fam_id,
            xf.group_id x_gid,
            yf.group_id y_gid,
            array_agg(distinct rtx.tag) f_tags,
            array_agg(distinct rty.tag) m_tags,
            {x_crosses_sql} x_crosses,
            {y_crosses_sql} AS y_crosses,
            requested_cross.id is not null AND NOT requested_cross.supplementation as refuge,
            requested_cross.id is not null AND requested_cross.supplementation as supplementation,
            pc.f,
            pc.di,
            (SELECT CASE WHEN pc.male = ANY(select distinct f.family from possible_cross pc join animal f on pc.female = f.id) 
                         THEN 1 ELSE 0 END  
                         + count(*) FROM requested_cross WHERE parent_m_fam = pc.male AND parent_f_fam != xf.id AND cross_date is null) 
                         AS selected_male_fam_cnt,              
            xf.cross_year as x_cross_year,
            yf.cross_year as y_cross_year,
            ({get_tag_crossed(True)}) as completed_y,
            ({get_tag_crossed(False)}) as completed_x
            """
    records_sql = f"""FROM possible_cross as pc
                    JOIN animal as x ON pc.female = x.id
                    JOIN animal as y ON y.family = pc.male
                    JOIN family as xf ON x.family = xf.id
                    JOIN family as yf on yf.id = pc.male
                    JOIN refuge_tag rtx ON rtx.animal = x.id
                    JOIN refuge_tag rty on rty.animal = y.id
               LEFT JOIN requested_cross ON xf.id = requested_cross.parent_f_fam AND pc.male = requested_cross.parent_m_fam
                   WHERE x.sex = 'F' AND y.sex = 'M' AND x.alive AND y.alive {filter_str}
                GROUP BY xf.group_id, yf.group_id, pc.male, xf.id, xf.cross_year, yf.cross_year, requested_cross.id, requested_cross.supplementation, pc.f, pc.di"""

    order_sql = f""" ORDER BY (requested_cross.id is not null and not requested_cross.supplementation)DESC, 
                 (requested_cross.id is not null and requested_cross.supplementation)DESC,
                 {y_crosses_sql},
                 {x_crosses_sql}, f
                 )q WHERE (completed_x IS NULL OR substr(completed_x, 1, length(completed_x)-4) = f_tags[1]) OFFSET :offset LIMIT :limit"""

    possible_crosses = execute_statements((columns_sql + records_sql + order_sql, query_params),
                                          username).get_as_list_of_dicts()

    cnt_sql = (f'''SELECT count(*) FROM (SELECT ({get_tag_crossed(False)}) as completed_x, 
                                                  array_agg(distinct rtx.tag) f_tags ''')
    cnt_sql_end = ")q WHERE (completed_x IS NULL OR substr(completed_x,1, length(completed_x)-4) = f_tags[1])"

    possible_crosses_cnt = execute_statements((cnt_sql + records_sql + cnt_sql_end, query_params),
                                              username).get_single_result()

    return possible_crosses, possible_crosses_cnt


def get_count_possible_females(username):
    possible_females_cnt_sql = """SELECT count(distinct female) from possible_cross"""
    return execute_statements(possible_females_cnt_sql, username).get_single_result()


def add_requested_cross(username, fam_f_id, fam_m_id, f, supplementation):
    cross_id = uuid.uuid4()
    insert_requested_sql = f"""
        INSERT INTO requested_cross (id, parent_f_fam, parent_m_fam, f, supplementation)
        VALUES ('{cross_id}','{fam_f_id}', '{fam_m_id}', {f}, {supplementation})"""
    return execute_statements(insert_requested_sql, username, ResultType.RowCount).get_single_result()


def remove_requested_cross(username, fam_f_id, fam_m_id):
    insert_requested_sql = f"""
        DELETE FROM requested_cross
        WHERE parent_f_fam = '{fam_f_id}' AND parent_m_fam = '{fam_m_id}'"""
    return execute_statements(insert_requested_sql, username, ResultType.RowCount).get_single_result()


def get_requested_crosses_csv(username, csv_file):
    req_crosses = get_requested_crosses(username)
    csv_file.write(
        f",Female Tags,Female Family,Male Tags,Male Family,Female Family Prev Cross Count,Male Family Prev Cross Count,f\n") # noqa
    prev_female_group = ""
    refuge_header = False
    supplementation_header = False
    for cross in req_crosses:
        if not refuge_header and not cross['supplementation']:
            csv_file.write("Refuge Crosses,,,,,,,\n")
            refuge_header = True
        if not supplementation_header and cross['supplementation']:
            csv_file.write("Supplementation Crosses,,,,,,,\n")
            supplementation_header = True
            prev_female_group = ""
        if cross['f_group_id'] == prev_female_group:
            cross['f_tags'] = ''
            cross['f_group_id'] = ''
        else:
            prev_female_group = cross['f_group_id']
        csv_file.write(f",\"{'(pick one) ' if len(cross['f_tags']) > 1 else ''}{', '.join(cross['f_tags'])}\","
                       f"{cross['f_group_id']},"
                       f"\"{'(pick one) ' if len(cross['m_tags']) > 1 else ''}{', '.join(cross['m_tags'])}\","
                       f"{cross['m_group_id']},"
                       f"{cross['x_cross_cnt']},"
                       f"{cross['y_cross_cnt']},"
                       f"{cross['f']}\n")
    return


def get_requested_crosses(username):
    requested_crosses_sql = """
    SELECT array(select distinct unnest(array_agg ((select tag from refuge_tag where animal = f_parent.id order by f_parent.id)))) f_tags,
           f_family.group_id f_group_id,
           count(x_crosses) as x_cross_cnt,
           array(select distinct unnest(array_agg ((select tag from refuge_tag where animal = m_parent.id order by m_parent.id)))) m_tags,
           m_family.group_id m_group_id,
           count(y_crosses) as y_cross_cnt,
           requested_cross.f,
           requested_cross.supplementation
       FROM requested_cross
       JOIN animal f_parent on f_parent.family = parent_f_fam
       JOIN animal m_parent ON m_parent.family = parent_m_fam
       JOIN family f_family on f_family.id = f_parent.family
       JOIN family m_family on m_family.id = parent_m_fam
       LEFT JOIN pedigree y_crosses ON y_crosses.parent = m_parent.id
       LEFT JOIN pedigree x_crosses ON x_crosses.parent = f_parent.id
       WHERE f_parent.id IN (SELECT DISTINCT female from possible_cross)
       GROUP BY (requested_cross.f, f_family.group_id, m_family.group_id, requested_cross.supplementation)
       ORDER BY requested_cross.supplementation, count(x_crosses), count(y_crosses), requested_cross.f;
    """
    return execute_statements(requested_crosses_sql, username).get_as_list_of_dicts()


def add_completed_cross(username, f_tag, m_tag, f, cross_date_str, table_name, requested_cross):
    cross_date = datetime.datetime.strptime(cross_date_str, '%m/%d/%Y')

    group_id_seq = f"""CREATE SEQUENCE IF NOT EXISTS group_id_{cross_date.year}"""
    execute_statements(group_id_seq, username, ResultType.NoResult)

    fam_ids = requested_cross.split('__')
    insert_completed_sql = f"""
        INSERT INTO {table_name} (id, parent_1, parent_2, cross_date, group_id, di, f) 
        SELECT '{uuid.uuid4()}',
                f_tag.animal, 
                m_tag.animal, 
                to_date('{cross_date_str}'::varchar, 'MM/DD/YYYY'), 
                nextval('group_id_{cross_date.year}'),
                (f_fam.di + m_fam.di) / 2 + 1,
                {f}
          FROM refuge_tag f_tag 
          JOIN refuge_tag m_tag ON TRUE
          JOIN animal fa ON fa.id = f_tag.animal
          JOIN animal ma ON ma.id = m_tag.animal
          JOIN family f_fam ON f_fam.id = fa.family
          JOIN family m_fam ON m_fam.id = ma.family
         WHERE m_tag.tag = \'{m_tag}' AND f_tag.tag = \'{f_tag}\'
           AND m_tag.year = date_part('year', CURRENT_DATE) AND f_tag.year = date_part('year', CURRENT_DATE)
           AND f_fam.id = '{fam_ids[0]}' AND m_fam.id = '{fam_ids[1]}'"""

    # Also update requested_cross table to say what male and female we've used as it makes determining crosses count
    # for Possible Crosses table much eaiser
    update_req_cross_sql = f"""
        UPDATE requested_cross SET (parent_f, parent_m, cross_date) = (fa.id, ma.id, to_date('{cross_date_str}'::varchar, 'MM/DD/YYYY')) 
            FROM refuge_tag rtf
            JOIN refuge_tag rtm ON TRUE
            JOIN animal fa ON fa.id = rtf.animal
            JOIN animal ma ON ma.id = rtm.animal
           WHERE rtm.tag = \'{m_tag}' AND rtf.tag = \'{f_tag}\'
             AND rtm.year = date_part('year', CURRENT_DATE) AND rtf.year = date_part('year', CURRENT_DATE)
"""

    if execute_statements([insert_completed_sql, update_req_cross_sql], username, ResultType.RowCount).row_cnts[0] < 1:
        LOGGER.error(f"Family record was not added for parents: {f_tag} and {m_tag}")
        return False

    return True


def insert_possible_crosses(username: str, possible_crosses: list):
    """
    Given a list of  possible crosses insert them
    :param username: Username responsible for the insert
    :param possible_crosses: List of possible crosses with f values calculated
    :return: Number of available females inserted

"""
    with get_connection(**make_connection_kwargs(DEFAULT_DB_PARAMS, username=username)) as conn:
        with conn.connection.cursor() as cursor:
            return insert_table_data('possible_cross', possible_crosses, cursor)


def cleanup_previous_available_females(username: str, female_tags: set):
    """
    Deletes previous females used for determining possible crosses if they are no longer in the given
    female_tags list.
    :param username: User responsible for removal of old possible female
    :param female_tags: Refuge tags of females to use to determine possible crosses
    :return:
    """
    delete_sql = ('''DELETE FROM possible_cross pc USING refuge_tag rt 
                                                 JOIN animal x on x.id =rt.animal
                                                 JOIN family xf on xf.id = x.family
                                                 JOIN family yf on yf.group_id = xf.group_id
     WHERE not (tag = ANY(:f_tags)) AND female = animal
                  OR yf.id = pc.male''',
                  {"f_tags": list(female_tags)})
    execute_statements(delete_sql, username, ResultType.NoResult)


def select_available_female_tags(username):
    results = execute_statements('SELECT distinct tag FROM possible_cross JOIN refuge_tag on animal = female',
                                 username).row_results
    f_tags = [row[0] for row in results]

    return ", ".join(f_tags)


def set_available_females(username:str, females: list):
    """
    Possible crosses along with their f values will be determined for the given available females.
    These available females will replace any previous.
    :param username: user who is setting the available females
    :param females: The females to be set as available.
    :return: result of the operation, either success with the list of available females, or error if
    unable to set. A warning will also be included if the list included tags that weren't included in the set
    of available females
    """
    try:
        insert_cnt = determine_and_insert_possible_crosses(username, females)
    except Exception as e:
        return {"success": False, "error": str(e)}

    return_val = {'success': True}
    if insert_cnt < len(females):
        possible_females_cnt = get_count_possible_females(username)
        if len(females) > possible_females_cnt:
            f_tags_len = len(females)
            return_val['warning'] = \
                f"{'' if possible_females_cnt == 0 else 'Only '}{possible_females_cnt} female fish are available for " \
                f"crossing, however you supplied a list of {f_tags_len} female tag{'' if f_tags_len == 1 else 's'}. " \
                "Confirm all tags were specified correctly and all the fish for the entered tags have previously " \
                "been uploaded and are present in the Manage Fish UI. "
            if possible_females_cnt == 0:
                return_val['success'] = False
                return_val['error'] = return_val['warning']
                return_val.pop('warning')
                return return_val

    return_val['data'] = select_available_female_tags(username)
    return return_val


def determine_and_insert_possible_crosses(username_or_err, cleaned_f_tags):
    cleanup_previous_available_females(username_or_err, cleaned_f_tags)

    possible_crosses = get_new_possible_crosses_for_females(username_or_err, cleaned_f_tags)

    if len(possible_crosses):
        f_matrix = build_matrix_from_existing(username_or_err)
        for cross_idx, cross in enumerate(possible_crosses):
            cross['f'] = f_matrix.calculate_f_for_potential_cross(cross['female_fam'], cross['male'])
            cross['id'] = str(uuid.uuid4())
            cross.pop('female_fam')
        insert_cnt = insert_possible_crosses(username_or_err, possible_crosses)
    else:
        insert_cnt = 0

    return insert_cnt


def get_completed_crosses_by_family(username, query_params):
    filter_str = 'xf.id = :fam_id or yf.id = :fam_id'
    return get_completed_crosses(username, query_params, 'ORDER BY cross_date', filter_str)


def get_completed_crosses(username, query_params, order_by_clause, filter_str):
    like_filter_str = ""
    if query_params.get('like_filter'):
        like_filter_str = f" AND ("
        like_filter = "LIKE :like_filter || '%'"
        like_filter_str += f"rty.tag {like_filter} OR rtx.tag {like_filter} OR "
        like_filter_str += f"xf.group_id::text {like_filter} OR yf.group_id::text {like_filter})"

    exact_filter = query_params.get('exact_filters')
    exact_filters = []
    for idx, (key, value) in enumerate(exact_filter.items()):
        if value == -1:
            # -1 is used to indicate all WT group_ids any of which would be considered a match and all are < 0
            exact_filters.append(f"{key} < 0")
        else:
            exact_filters.append(f"{key} = :ef_{idx}")
        query_params[f"ef_{idx}"] = value
    if exact_filters:
        filter_str = f" {filter_str} AND ({' AND '.join(exact_filters)})"

    columns_sql = f"""
        SELECT completed_cross.id as id,
            completed_cross.group_id as group_id,
            completed_cross.mfg as mfg,
            xf.id p1_fam_id,
            yf.id p2_fam_id,
            CASE WHEN xf.group_id < 0 THEN 'WT' ELSE xf.group_id::text END x_gid,
            CASE WHEN yf.group_id < 0 THEN 'WT' ELSE yf.group_id::text END y_gid,
            rtx.tag f_tag,
            rty.tag as m_tag,
            (SELECT count(1) FROM family next_gen_fam_f JOIN animal a ON (next_gen_fam_f.parent_1 = a.id OR next_gen_fam_f.parent_2 = a.id) WHERE a.family = xf.id AND NOT next_gen_fam_f.cross_failed) as x_crosses,
            (SELECT count(1) FROM family next_gen_fam_f JOIN animal a ON (next_gen_fam_f.parent_1 = a.id OR next_gen_fam_f.parent_2 = a.id) WHERE a.family = yf.id AND NOT next_gen_fam_f.cross_failed) as y_crosses,
            completed_cross.f,
            completed_cross.di,
            completed_cross.cross_date::date,
            completed_cross.cross_failed,
            (SELECT count(1) FROM supplementation_family sf WHERE sf.parent_1 = x.id AND sf.parent_2 = y.id) as supplementation,
            coalesce(note.content, '') notes
            """

    family_table = 'family' if query_params.get('refuge', True) else 'supplementation_family'
    records_sql = f""" FROM {family_table} as completed_cross
                    JOIN animal as x ON x.id = completed_cross.parent_1
                    JOIN animal as y ON y.id = completed_cross.parent_2
                    JOIN family as xf ON x.family = xf.id
                    JOIN family as yf ON yf.id = y.family
               LEFT JOIN refuge_tag rtx ON rtx.animal = x.id
               LEFT JOIN refuge_tag rty ON rty.animal = y.id
               LEFT JOIN {family_table}_note note on completed_cross.id = note.family
                   WHERE {filter_str} {like_filter_str}"""

    order_by = f" {order_by_clause} {'OFFSET :offset' if 'offset' in query_params else ''} " + \
               f"{'LIMIT :limit' if 'limit' in query_params else ''}"

    completed_crosses = execute_statements((columns_sql + records_sql + order_by, query_params),
                                           username).get_as_list_of_dicts()

    cnt_sql = 'SELECT count(*) '

    completed_crosses_cnt = execute_statements((cnt_sql + records_sql, query_params),
                                               username).get_single_result()

    return completed_crosses, completed_crosses_cnt


def set_cross_failed(username, params):
    sql = "UPDATE family set cross_failed = :cross_failed WHERE id = :fam_id"
    execute_statements((sql, params), username, ResultType.NoResult)


def set_use_for_supplementation(username, params):
    if params['use_for_supplementation']:
        sql = f"""INSERT INTO supplementation_family (id, parent_1, parent_2, cross_date, group_id, di, f)
                SELECT gen_random_uuid(), parent_1, parent_2, cross_date, group_id, di, f
            FROM family where mfg = ANY (SELECT mfg from family where :fam_id = id) ON CONFLICT DO NOTHING"""
    else:
        sql = f"""DELETE FROM supplementation_family sf USING family f
                        WHERE f.id = :fam_id
                          AND sf.parent_1 = f.parent_1
                          AND sf.parent_2 = f.parent_2"""

    execute_statements((sql, params), username, ResultType.NoResult)


def get_exported_crosses_csv(username, params, csv_file):
    filter_str = 'completed_cross.cross_year = :year'
    crosses, _ = get_completed_crosses(username, params, "ORDER BY cross_date, group_id", filter_str)
    csv_file.write(
        f"Date,Male,Male Family,Female,Female Family,PC/FSG,{'MFG,' if params['refuge'] else ''}Notes\n")
    for cross in crosses:
        cross_notes = ""
        if cross['supplementation'] and params['refuge']:
            cross_notes += "Cross also used for supplementation."
        if cross['cross_failed']:
            cross_notes += "Cross failed."
        mfg = ""
        if params['refuge']:
            f"{'Unknown' if not cross['mfg'] else cross['mfg']},"
        csv_file.write(f"{cross['cross_date']},"
                       f"{cross['m_tag']},"
                       f"{cross['y_gid']},"
                       f"{cross['f_tag']},"
                       f"{cross['x_gid']},"
                       f"{cross['group_id']},"
                       f"{mfg}"
                       f"{cross_notes}\n")
    return
