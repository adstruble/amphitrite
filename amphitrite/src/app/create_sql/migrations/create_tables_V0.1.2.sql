CREATE OR REPLACE FUNCTION maybe_truncate_date(cross_date date)
RETURNS TEXT AS $$
    BEGIN
        RETURN CASE WHEN date_trunc('year', cross_date) = cross_date
            THEN EXTRACT(year FROM cross_date)::text
        ELSE cross_date::text END;
    END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION convert_to_generation_id(cross_date date, sex sex, group_id int)
        RETURNS TEXT AS $$
    BEGIN
        RETURN CASE WHEN group_id is NULL
            THEN
            rpad((extract(YEAR FROM cross_date) - 2005)::text, 2, '0') || 'xxx' || CASE WHEN sex = 'M' THEN '2' ELSE '1' END
            ELSE CASE WHEN group_id < 0
                THEN 'WT'
                ELSE
                    rpad((extract(YEAR FROM cross_date) - 2005)::text, 2, '0') || lpad(group_id::text, 3, '0') || CASE WHEN sex = 'M' THEN '2' ELSE '1' END
                END
            END;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION get_ordered_pedigree_string(target_fish_id UUID, max_generations INTEGER)
        RETURNS TEXT AS $$
    BEGIN
        RETURN (
            WITH RECURSIVE pedigree_path AS (
                -- Base case: start with target fish
                SELECT
                    a.id,
                    a.box,
                    rt.tag  as tag,
                    maybe_truncate_date(f.cross_date) as cross_date,
                    convert_to_generation_id(f.cross_date, a.sex, next_gen.group_id)as gen_id,
                    0 as generation
                FROM animal a
                JOIN family f on a.family = f.id
                LEFT JOIN family next_gen ON next_gen.parent_2 = a.id OR next_gen.parent_1 = a.id
                LEFT JOIN refuge_tag rt ON rt.animal = a.id
                WHERE a.id = target_fish_id::uuid

                UNION ALL

                -- Recursive case: add parents in consistent order
                SELECT
                    parent.id,
                    parent.box,
                    parent_tag.tag as tag,
                    maybe_truncate_date(parent_family.cross_date) as cross_date,
                    convert_to_generation_id(parent_family.cross_date, parent.sex, fam.group_id) as gen_id,
                    pp.generation + 1
                FROM pedigree_path pp
                         JOIN animal a ON a.id = pp.id
                         JOIN family fam ON a.family = fam.id
                         JOIN animal parent ON parent.id IN (fam.parent_1, fam.parent_2)
                         JOIN family parent_family ON parent.family = parent_family.id
                    LEFT JOIN refuge_tag parent_tag ON parent_tag.animal = parent.id
                WHERE pp.generation < max_generations
            ),
                generation_summary AS (
                               SELECT
                                   generation,
                                   string_agg(gen_id || ' (' || coalesce('Tag:' || tag || ' ', '') || 'CrossDate:' || cross_date || coalesce(' Box:' || box::text, '') || ')', ' || ' ORDER BY gen_id ) as generation_tags
                               FROM pedigree_path
                               GROUP BY generation
                               ORDER BY generation
                           )
            SELECT string_agg(generation_tags, ' <--' || generation || '-- ' ORDER BY generation)
            FROM generation_summary
        );
    END;
    $$ LANGUAGE plpgsql;