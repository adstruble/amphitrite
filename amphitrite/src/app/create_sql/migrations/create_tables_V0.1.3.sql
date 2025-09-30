ALTER TABLE family_note DROP CONSTRAINT family_note_family_fkey;
ALTER TABLE family_note ADD CONSTRAINT family_note_family_fkey FOREIGN KEY (family) REFERENCES family(id) ON DELETE CASCADE;
CREATE OR REPLACE FUNCTION get_cross_year_adjustment(parents_cross_date date)
    RETURNS INT AS $$
    BEGIN
        RETURN CAST(2229 - FLOOR(EXTRACT(YEAR FROM parents_cross_date) / 9.0) AS INTEGER);
    END;
$$ LANGUAGE plpgsql;
DROP FUNCTION convert_to_generation_id(date,sex,integer);
CREATE FUNCTION convert_to_generation_id(parents_cross_date date, sex sex, group_id int)
    RETURNS TEXT AS $$
BEGIN
    RETURN CASE WHEN group_id is NULL
                    THEN
                    rpad((extract(YEAR FROM parents_cross_date) - get_cross_year_adjustment(parents_cross_date))::text, 2, '0')
                        || 'xxx' || CASE WHEN sex = 'M' THEN '2' ELSE '1' END
                ELSE CASE WHEN group_id < 0
                              THEN 'WT'
                          ELSE
                              rpad((extract(YEAR FROM parents_cross_date) - get_cross_year_adjustment(parents_cross_date))::text, 2, '0')
                                  || lpad(group_id::text, 3, '0') || CASE WHEN sex = 'M' THEN '2' ELSE '1' END
                    END
        END;
END;
$$ LANGUAGE plpgsql;