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


CREATE TYPE sex AS ENUM ('F', 'M');

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

INSERT INTO amphi_user (username, password, enabled, id, created_at, last_modified)
     VALUES ('amphiadmin', 'amphiadmin', True, '3905193d-1556-4800-bc9b-27a538a9fd55'::uuid, now(), now());
ALTER TABLE element ADD COLUMN last_modified_by uuid NOT NULL REFERENCES amphi_user(id) DEFERRABLE
    DEFAULT '3905193d-1556-4800-bc9b-27a538a9fd55';

CREATE TABLE family (
    sibling_birth_year int NOT NULL,
    group_id int NOT NULL, -- TODO Should this be text? Do we even need it?'
    di float DEFAULT -1, -- This can be calculated, but probably want to store it
    do_not_cross bool NOT NULL DEFAULT FALSE, -- This is to be indicated manually by crosser,
    PRIMARY KEY (id)
) INHERITS (element);

CREATE TABLE fish (
    sex sex NOT NULL,
    box int,
    -- spawn_year int, -- TODO Isn't this same as sibling_birth_year? Is it the year THIS FISH was a parent, or a sibling?, removing for now
    alive bool NOT NULL DEFAULT TRUE,
    family uuid REFERENCES family (id) DEFERRABLE, -- have to allow this to be null as family might only be in morts
    PRIMARY KEY (id)
) INHERITS (element);
CREATE INDEX fish_family_idx on fish(family);

CREATE TABLE gene (
    name varchar(100) NOT NULL,
    allele_1 char NOT NULL,
    allele_2 char NOT NULL,
    fish uuid REFERENCES fish(id) DEFERRABLE NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name, fish)
)INHERITS (element);
CREATE INDEX gene_fish_idx on gene(fish);

CREATE TABLE refuge_tag (
    tag varchar(6) NOT NULL, -- TODO Is length of 6 ok?  Also note that this is nonunique across
    -- years, we could add a year column and and a unique constraint across the 2 columns
    date_tagged timestamp,
    date_untagged timestamp,
    fish uuid NOT NULL REFERENCES fish(id) DEFERRABLE,
    PRIMARY KEY (id)
    ) INHERITS (element);
CREATE INDEX tagged_fish_idx on refuge_tag (fish);

CREATE TABLE crossed_with (
    female      uuid NOT NULL REFERENCES fish (id) DEFERRABLE,
    male        uuid NOT NULL REFERENCES fish (id) DEFERRABLE,
    cross_date  timestamp NOT NULL,
    parents_of  uuid REFERENCES family(id) DEFERRABLE,
    PRIMARY KEY (id)
    ) INHERITS (element);

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
