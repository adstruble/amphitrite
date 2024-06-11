CREATE USER amphiuser WITH ENCRYPTED PASSWORD 'amphiuser' CONNECTION LIMIT 20;
GRANT amphiuser to amphiadmin;
ALTER DEFAULT PRIVILEGES FOR USER amphiadmin IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO amphiuser;
CREATE USER amphireadonly WITH ENCRYPTED PASSWORD 'amphireadonly' CONNECTION LIMIT 20;
GRANT amphireadonly to amphiadmin;
ALTER DEFAULT PRIVILEGES FOR USER amphiadmin IN SCHEMA public GRANT SELECT ON TABLES TO amphireadonly;

CREATE OR REPLACE FUNCTION reset_access() returns void as $$
DECLARE
    once boolean;
BEGIN
    SELECT EXISTS(select * from information_schema.tables where table_name = 'session_vars' and table_type = 'LOCAL TEMPORARY') INTO once;
    IF NOT once THEN
        CREATE TEMPORARY TABLE IF NOT EXISTS session_vars (key text PRIMARY KEY, value text);
        REVOKE ALL on session_vars FROM PUBLIC;
        GRANT SELECT on session_vars TO PUBLIC;
        CREATE UNIQUE INDEX ON pg_temp.session_vars (key);
    ELSE
        TRUNCATE pg_temp.session_vars;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION session_add_var(k text, value text) returns void as $$
BEGIN
    INSERT INTO pg_temp.session_vars (key, value) VALUES (k, value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION session_add_user(value text ) returns void as $$
BEGIN
    INSERT INTO pg_temp.session_vars (key, value) VALUES ('user_current', value);
    INSERT INTO pg_temp.session_vars SELECT 'user_id' as key, id as value FROM amphi_user WHERE username = value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION drop_null_constraints(varchar) RETURNS integer AS $$
DECLARE
    columnName varchar(50);
BEGIN

    FOR columnName IN

        select a.attname
        from pg_catalog.pg_attribute a
        where attrelid = $1::regclass
          and a.attnum > 0
          and not a.attisdropped
          and a.attnotnull and a.attname not in(

            SELECT
                pg_attribute.attname
            FROM pg_index, pg_class, pg_attribute
            WHERE
                    pg_class.oid = $1::regclass AND
                    indrelid = pg_class.oid AND
                    pg_attribute.attrelid = pg_class.oid AND
                    pg_attribute.attnum = any(pg_index.indkey)
              AND indisprimary)

        LOOP
            EXECUTE 'ALTER TABLE ' || $1 ||' ALTER COLUMN '||columnName||' DROP NOT NULL';
        END LOOP;
    RAISE NOTICE 'Done removing the NOT NULL Constraints for TABLE: %', $1;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;


CREATE TYPE sex AS ENUM ('F', 'M', 'UNKNOWN');

CREATE TABLE element (
    id uuid PRIMARY KEY,
    created_at timestamp,
    last_modified timestamp
);

CREATE TABLE amphi_user (
    username varchar(100) NOT NULL,
    password varchar(100) NOT NULL,
    enabled bool NOT NULL,
    PRIMARY KEY (id)
) INHERITS (element);
ALTER TABLE amphi_user ADD CONSTRAINT unique_user UNIQUE(username);

INSERT INTO amphi_user (username, password, enabled, id, created_at, last_modified)
     VALUES ('amphiadmin', 'amphiadmin', True, '3905193d-1556-4800-bc9b-27a538a9fd55'::uuid, now(), now());
ALTER TABLE element ADD COLUMN last_modified_by uuid NOT NULL REFERENCES amphi_user(id) DEFERRABLE
    DEFAULT '3905193d-1556-4800-bc9b-27a538a9fd55';

CREATE TABLE animal (
      sex sex NOT NULL,
      box int,
      alive bool NOT NULL DEFAULT TRUE,
      wt bool NOT NULL DEFAULT FALSE,
      gen_id int not null,
      PRIMARY KEY (id)
) INHERITS (element);

CREATE TABLE family (
                        group_id int NOT NULL, -- TODO Should this be text? Do we even need it? Yes, because we want the family to be unique
    -- and we might only know the birth year and not the exact cross_data when first importing data, this would disallow
    -- repeat crosses of the same male and female by the unique constraint (which we may or may not want)
                        di float DEFAULT -1, -- This can be calculated, but probably want to store it. (value = 1 for wildtype)
                        f float DEFAULT -1, -- This can be calculated, almost assuredly want to store it (value = 0 for wildtype)
                        do_not_cross bool NOT NULL DEFAULT FALSE, -- This is to be indicated manually by crosser,
                        parent_1    uuid REFERENCES animal (id) DEFERRABLE,
                        parent_2    uuid REFERENCES animal (id) DEFERRABLE,
                        cross_date  timestamp NOT NULL, -- exact date the parents were crossed
                        cross_year numeric GENERATED ALWAYS AS (extract(year from cross_date)) STORED, -- The year the parent's were crossed
                        PRIMARY KEY (id)
) INHERITS (element);
ALTER TABLE family ADD CONSTRAINT unique_parents UNIQUE(parent_1, parent_2, cross_date, group_id);
-- group ids aren't unique per year. Example 2010: 300252/300251 -> GroupID 25 for children 401271 401492 400962
-- and 2010 200252/200251 -> Group ID 25 for child 402601
--ALTER TABLE family ADD CONSTRAINT unique_family_no_parents UNIQUE(cross_year, group_id);
ALTER TABLE family ADD CONSTRAINT different_parents CHECK (not(parent_1 = parent_2));

-- Add family column to animal now that that table exists
ALTER TABLE animal ADD column family uuid NOT NULL REFERENCES family (id) DEFERRABLE;
CREATE INDEX animal_family_idx on animal(family);

CREATE TABLE pedigree (
                          parent uuid REFERENCES animal(id) DEFERRABLE,
                          child uuid REFERENCES animal(id) DEFERRABLE
)INHERITS (element);
ALTER TABLE pedigree ADD CONSTRAINT unique_pedigree UNIQUE (parent, child);

CREATE TABLE gene (
                      name varchar(100) NOT NULL,
                      allele_1 char NOT NULL,
                      allele_2 char NOT NULL,
                      animal uuid REFERENCES animal(id) DEFERRABLE NOT NULL,
                      PRIMARY KEY (id),
                      UNIQUE (name, animal)
)INHERITS (element);
CREATE INDEX animal_fish_idx on gene(animal);

CREATE TABLE refuge_tag (
                            tag varchar(12) NOT NULL, -- Making length of 12. Normally it is 6, but there are 'special fish' that
    -- may have different format that we want to allow. (So far (231109) these are all dead)
    -- Also note that this tag field is non-unique across years, we could add a year column and add a unique constraint
    -- across the 2 columns
                            date_tagged timestamp,
                            date_untagged timestamp,
                            animal uuid NOT NULL REFERENCES animal(id) DEFERRABLE,
                            PRIMARY KEY (id)
) INHERITS (element);
CREATE INDEX tagged_animal_idx on refuge_tag (animal);

CREATE TABLE notes (
                       text text,
                       PRIMARY KEY (id)
) INHERITS (element);

CREATE TABLE notes_element (
                               note uuid REFERENCES notes(id) DEFERRABLE,
                               element uuid REFERENCES element(id) DEFERRABLE
);

CREATE TABLE version (
                         major int NOT NULL,
                         minor int NOT NULL,
                         patch int NOT NULL
);

INSERT INTO version (major, minor, patch) VALUES (0, 0, 1);
