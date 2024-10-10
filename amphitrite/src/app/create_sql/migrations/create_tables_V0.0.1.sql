CREATE USER amphiuser WITH ENCRYPTED PASSWORD 'amphiuser' CONNECTION LIMIT 20;
GRANT amphiuser to amphiadmin;
ALTER DEFAULT PRIVILEGES FOR USER amphiadmin IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO amphiuser;
CREATE USER amphireadonly WITH ENCRYPTED PASSWORD 'amphireadonly' CONNECTION LIMIT 20;
GRANT amphireadonly to amphiadmin;
ALTER DEFAULT PRIVILEGES FOR USER amphiadmin IN SCHEMA public GRANT SELECT ON TABLES TO amphireadonly;

CREATE SCHEMA history;
REVOKE ALL ON SCHEMA history FROM public;

CREATE TABLE history.logged_actions (
        event_id bigint,
        schema_name text not null,
        table_name text not null,
        id text not null,
        relid oid not null,
        postgres_user_name text,
        application_user_name text not null,
        action_tstamp_tx TIMESTAMP WITH TIME ZONE NOT NULL,
        action_tstamp_stm TIMESTAMP WITH TIME ZONE NOT NULL,
        action_tstamp_clk TIMESTAMP WITH TIME ZONE NOT NULL,
        transaction_id bigint,
        client_addr inet,
        client_port integer,
        client_query text,
        action TEXT NOT NULL CHECK (action IN ('I','D','U','T')),
        row_data jsonb,
        changed_fields jsonb,
        statement_only boolean not null,
        schema_version text
);
REVOKE ALL ON history.logged_actions FROM public;
CREATE INDEX IF NOT EXISTS logged_actions_relid_idx ON history.logged_actions(relid);
CREATE INDEX IF NOT EXISTS logged_actions_txid_idx ON history.logged_actions(transaction_id);
CREATE INDEX IF NOT EXISTS logged_actions_tablename_idx ON history.logged_actions(table_name);
CREATE INDEX IF NOT EXISTS logged_actions_action_tstamp_tx_idx ON history.logged_actions(action_tstamp_tx);
CREATE INDEX IF NOT EXISTS logged_actions_action_tstamp_stm_idx ON history.logged_actions(action_tstamp_stm);
CREATE INDEX IF NOT EXISTS logged_actions_id_idx ON history.logged_actions(id);
CREATE INDEX IF NOT EXISTS logged_actions_action_idx ON history.logged_actions(action);


CREATE OR REPLACE FUNCTION reset_access() returns void as
$$
DECLARE
    once boolean;
BEGIN
    SELECT EXISTS(select *
                  from information_schema.tables
                  where table_name = 'session_vars' and table_type = 'LOCAL TEMPORARY')
    INTO once;
    IF NOT once THEN
        CREATE TEMPORARY TABLE IF NOT EXISTS session_vars
        (
            key   text PRIMARY KEY,
            value text
        );
        REVOKE ALL on session_vars FROM PUBLIC;
        GRANT SELECT on session_vars TO PUBLIC;
        CREATE UNIQUE INDEX ON pg_temp.session_vars (key);
    ELSE
        TRUNCATE pg_temp.session_vars;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION session_add_var(k text, value text) returns void as
$$
BEGIN
    INSERT INTO pg_temp.session_vars (key, value) VALUES (k, value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION session_add_user(value text) returns void as
$$
BEGIN
    INSERT INTO pg_temp.session_vars (key, value) VALUES ('user_current', value);
    INSERT INTO pg_temp.session_vars SELECT 'user_id' as key, id as value FROM amphi_user WHERE username = value;
    IF get_current_user() IS NULL THEN RAISE EXCEPTION 'Unknown user, database transactions will be prohibited';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT reset_access();

CREATE OR REPLACE FUNCTION desired_time_st() RETURNS TIMESTAMP AS $$
    SELECT coalesce(NULLIF(current_setting('planx.desired_time', 't'), ''), statement_timestamp()::text)::timestamp;
$$ LANGUAGE SQL STABLE STRICT;

CREATE OR REPLACE FUNCTION drop_null_constraints(varchar) RETURNS integer AS
$$
DECLARE
    columnName varchar(50);
BEGIN

    FOR columnName IN
        select a.attname
        from pg_catalog.pg_attribute a
        where attrelid = $1::regclass
          and a.attnum > 0
          and not a.attisdropped
          and a.attnotnull
          and a.attname not in (SELECT pg_attribute.attname
                                FROM pg_index,
                                     pg_class,
                                     pg_attribute
                                WHERE pg_class.oid = $1::regclass
                                  AND indrelid = pg_class.oid
                                  AND pg_attribute.attrelid = pg_class.oid
                                  AND pg_attribute.attnum = any (pg_index.indkey)
                                  AND indisprimary)

        LOOP
            EXECUTE 'ALTER TABLE ' || $1 || ' ALTER COLUMN ' || columnName || ' DROP NOT NULL';
        END LOOP;
    RAISE NOTICE 'Done removing the NOT NULL Constraints for TABLE: %', $1;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;


CREATE TYPE sex AS ENUM ('F', 'M', 'UNKNOWN');

CREATE TABLE element
(
    id            uuid PRIMARY KEY,
    created_at    timestamp,
    last_modified timestamp
);

CREATE TABLE amphi_user
(
    username varchar(100) NOT NULL,
    password varchar(100) NOT NULL,
    enabled  bool         NOT NULL,
    PRIMARY KEY (id)
) INHERITS (element);
ALTER TABLE amphi_user
    ADD CONSTRAINT unique_user UNIQUE (username);
CREATE INDEX amphi_user_username_idx ON amphi_user(username);

CREATE OR REPLACE FUNCTION get_current_user()
    RETURNS text AS $$
SELECT amphi_user.id FROM pg_temp.session_vars JOIN amphi_user ON value = amphi_user.username WHERE key = 'user_current';
$$ language 'sql' STABLE STRICT;

INSERT INTO amphi_user (username, password, enabled, id, created_at, last_modified)
VALUES ('amphiadmin', 'amphiadmin', True, '3905193d-1556-4800-bc9b-27a538a9fd55'::uuid, now(), now());
ALTER TABLE element
    ADD COLUMN last_modified_by uuid NOT NULL REFERENCES amphi_user (id) DEFERRABLE
        DEFAULT '3905193d-1556-4800-bc9b-27a538a9fd55';
ALTER TABLE element
    ADD COLUMN created_by uuid NOT NULL REFERENCES amphi_user (id) DEFERRABLE
        DEFAULT '3905193d-1556-4800-bc9b-27a538a9fd55';

CREATE OR REPLACE FUNCTION element_pre_insert()
    RETURNS trigger
AS $$
DECLARE
    timestamp timestamp;
    cuser text;
BEGIN
    timestamp = desired_time_st();
    cuser = get_current_user();
    NEW."last_modified" = timestamp;
    NEW."created_at" = timestamp;
    NEW."created_by" = cuser;
    NEW."last_modified_by" = cuser;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON element FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();

CREATE OR REPLACE FUNCTION public.element_pre_update()
    RETURNS trigger
AS $function$
BEGIN
    IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
        NEW.last_modified = desired_time_st();
        NEW."last_modified_by" = get_current_user();
        RETURN NEW;
    ELSE
        RETURN OLD;
    END IF;
END;
$function$ language 'plpgsql';
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON element FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE OR REPLACE FUNCTION history.if_modified_func() RETURNS TRIGGER AS $body$
    DECLARE
        history_row history.logged_actions;
        updated_row jsonb;
        _key text;
        _value text;
    BEGIN
        IF TG_WHEN <> 'AFTER' THEN
            RAISE EXCEPTION 'history.if_modified_func() may only run as an AFTER trigger';
        END IF;

        history_row = ROW(
            999,                                            -- event_id (placeholder, column to be dropped in future)
            TG_TABLE_SCHEMA::text,                          -- schema_name
            TG_TABLE_NAME::text,                            -- table_name
            NULL,                                           -- id
            TG_RELID,                                       -- relation OID for much quicker searches
            session_user::text,                             -- postgres_user_name
            get_current_user(),                             -- application_user_name
            now(),                                          -- action_tstamp_tx
            statement_timestamp(),                          -- action_tstamp_stm
            clock_timestamp(),                              -- action_tstamp_clk
            txid_current(),                                 -- transaction ID
            inet_client_addr(),                             -- client_addr
            inet_client_port(),                             -- client_port
            current_query(),                                -- top-level query or queries (if multistatement) from client
            substring(TG_OP,1,1),                           -- action
            NULL, NULL,                                     -- row_data, changed_fields
            'f',                                            -- statement_only
            NULL, NULL,                                     -- created_in, last_modified_in
            (SELECT concat(major, '.', minor, '.', patch, '.')
               FROM version ORDER BY major DESC, minor DESC , patch DESC LIMIT 1) -- schema_version
            );

        IF NOT TG_ARGV[0]::boolean IS DISTINCT FROM 'f'::boolean THEN
            history_row.client_query = NULL;
        END IF;

        IF ((TG_OP = 'UPDATE' OR TG_OP = 'INSERT') AND TG_LEVEL = 'ROW') THEN
            -- Set id new value
            history_row.id = NEW.id;
        ELSIF (TG_LEVEL = 'ROW') THEN
            -- Set id to old value
            history_row.id = OLD.id;
        END IF;

        IF (TG_OP = 'UPDATE' AND TG_LEVEL = 'ROW') THEN
            history_row.row_data = row_to_json(OLD)::JSONB;
            updated_row = row_to_json(NEW)::jsonb;

            --Computing differences
            FOR _key, _value IN
                SELECT * from jsonb_each_text(history_row.row_data)
            LOOP
                IF history_row.row_data->>_key = updated_row->>_key OR (history_row.row_data->>_key IS NULL AND updated_row->>_key IS NULL) THEN
                    updated_row = updated_row - _key;
                END IF;
            END LOOP;
            history_row.changed_fields := updated_row;

            IF history_row.changed_fields IS NULL OR history_row.changed_fields = '{}'::JSONB THEN
                -- All changed fields are ignored. Skip this update.
                RETURN NULL;
            END IF;
        ELSIF (TG_OP = 'DELETE' AND TG_LEVEL = 'ROW') THEN
            history_row.row_data = row_to_json(OLD)::JSONB;
        ELSIF (TG_OP = 'INSERT' AND TG_LEVEL = 'ROW') THEN
            history_row.row_data = row_to_json(NEW)::JSONB;
        ELSIF (TG_LEVEL = 'STATEMENT' AND TG_OP IN ('INSERT','UPDATE','DELETE','TRUNCATE')) THEN
            history_row.statement_only = 't';
        ELSE
            RAISE EXCEPTION '[history.if_modified_func] - Trigger func added as trigger for unhandled case: %, %',TG_OP, TG_LEVEL;
        END IF;
        IF (TG_OP = 'TRUNCATE') THEN
            RETURN NULL;
        END IF;
        INSERT INTO history.logged_actions VALUES (history_row.*);
        RETURN NULL;
    END;
$body$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public;
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON element FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON element FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');

CREATE TABLE animal
(
    sex    sex  NOT NULL,
    box    int,
    alive  bool NOT NULL DEFAULT TRUE,
    wt     bool NOT NULL DEFAULT FALSE,
    gen_id int,
    PRIMARY KEY (id)
) INHERITS (element);
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON animal FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON animal FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON animal FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON animal FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE family
(
    group_id     int       NOT NULL,                                                 -- TODO Should this be text? Do we even need it? Yes, because we want the family to be unique
    -- and we might only know the birth year and not the exact cross_date when first importing data, this would disallow
    -- repeat crosses of the same male and female by the unique constraint (which we may or may not want)
    di           float              DEFAULT -1,                                      -- This can be calculated, but probably want to store it. (value = 1 for wildtype)
    f            float              DEFAULT -1,                                      -- This can be calculated, almost assuredly want to store it (value = 0 for wildtype)
    do_not_cross bool      NOT NULL DEFAULT FALSE,                                   -- This is to be indicated manually by crosser,
    parent_1     uuid REFERENCES animal (id) DEFERRABLE,
    parent_2     uuid REFERENCES animal (id) DEFERRABLE,
    cross_date   timestamp NOT NULL,                                                 -- exact date the parents were crossed
    cross_year   numeric GENERATED ALWAYS AS (extract(year from cross_date)) STORED, -- The year the parent's were crossed
    PRIMARY KEY (id)
) INHERITS (element);
-- group ids aren't unique per year. Example 2010: 300252/300251 -> GroupID 25 for children 401271 401492 400962
-- and 2010 200252/200251 -> Group ID 25 for child 402601
--ALTER TABLE family ADD CONSTRAINT unique_family_no_parents UNIQUE(cross_year, group_id);

-- There are 35 cases where the same parents were bred in two different years. One of these cases is
-- probably incorrect as one year is 2017 and one is 2007. However, the others seems legitimate.
-- Therefore we need to include cross_year in the constraint on unique parents
-- Here is the SQL to find them:
-- select array_agg(f1.gen_id) as children_first_cross, family.group_id,family.cross_year, array_agg(f2.gen_id) as children_second_cross, family_2.group_id,family_2.cross_year from family join family as family_2 on family.parent_1 = family_2.parent_1 and family.id != family_2.id AND family.parent_2 = family_2.parent_2 join animal f1 on f1.family = family.id join animal f2 on f2.family = family_2.id where family.cross_year < family_2.cross_year group by family.group_id, family.cross_year, family_2.group_id, family_2.cross_year;
ALTER TABLE family ADD CONSTRAINT unique_parents UNIQUE (parent_1, parent_2, cross_year);
ALTER TABLE family
    ADD CONSTRAINT different_parents CHECK (not (parent_1 = parent_2));
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON family FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON family FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON family FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON family FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

-- Add family column to animal now that that table exists
ALTER TABLE animal
    ADD column family uuid NOT NULL REFERENCES family (id) DEFERRABLE;
CREATE INDEX animal_family_idx on animal (family);

CREATE TABLE pedigree
(
    parent uuid REFERENCES animal (id) DEFERRABLE NOT NULL,
    child  uuid REFERENCES animal (id) DEFERRABLE
) INHERITS (element);
ALTER TABLE pedigree
    ADD CONSTRAINT unique_pedigree UNIQUE (parent, child);
CREATE INDEX pedigree_parent_idx on pedigree(parent);
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON pedigree FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON pedigree FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON pedigree FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON pedigree FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE requested_cross
(
    parent_m_fam uuid REFERENCES family (id) DEFERRABLE NOT NULL,
    parent_f_fam uuid REFERENCES family (id) DEFERRABLE NOT NULL,
    parent_f uuid REFERENCES animal (id) DEFERRABLE,
    parent_m uuid REFERENCES animal (id) DEFERRABLE,
    cross_date timestamp,
    f float not null
) INHERITS (element);
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON requested_cross FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON requested_cross FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON requested_cross FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON requested_cross FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE possible_cross
(
    female  uuid REFERENCES animal (id) NOT NULL,
      male  uuid REFERENCES family (id) NOT NULL,
         f  float NOT NULL,
        di  float NOT NULL
) INHERITS (element);
ALTER TABLE possible_cross ADD
    CONSTRAINT unique_parental_cross UNIQUE (female, male);
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON possible_cross FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON possible_cross FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON possible_cross FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON possible_cross FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE gene
(
    name     varchar(100)                           NOT NULL,
    allele_1 char                                   NOT NULL,
    allele_2 char                                   NOT NULL,
    animal   uuid REFERENCES animal (id) DEFERRABLE NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name, animal)
) INHERITS (element);
CREATE INDEX animal_fish_idx on gene (animal);
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON gene FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON gene FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON gene FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON gene FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE refuge_tag
(
    tag           varchar(12) NOT NULL, -- Making length of 12. Normally it is 6, but there are 'special fish' that
    -- may have different format that we want to allow. (So far (231109) these are all dead)
    -- Also note that this tag field is non-unique across years, we could add a year column and add a unique constraint
    -- across the 2 columns
    date_tagged   timestamp,
    date_untagged timestamp,
    animal        uuid        NOT NULL REFERENCES animal (id) DEFERRABLE,
    PRIMARY KEY (id)
) INHERITS (element);
CREATE INDEX tagged_animal_idx on refuge_tag (animal);
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON refuge_tag FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON refuge_tag FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON refuge_tag FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON refuge_tag FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE notes
(
    text text,
    PRIMARY KEY (id)
) INHERITS (element);
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON notes FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON notes FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON notes FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE notes_element
(
    note    uuid REFERENCES notes (id) DEFERRABLE,
    element uuid REFERENCES element (id) DEFERRABLE
) INHERITS (element);
CREATE TRIGGER history_trigger_row AFTER INSERT OR DELETE OR UPDATE ON notes_element FOR EACH ROW EXECUTE FUNCTION history.if_modified_func('false');
CREATE TRIGGER history_trigger_stm AFTER TRUNCATE ON notes_element FOR EACH STATEMENT EXECUTE FUNCTION history.if_modified_func('false');
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON notes_element FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON notes_element FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE f_matrix_row
(
    animal_fam uuid REFERENCES family (id) DEFERRABLE NOT NULL,
    parent_1_fam uuid REFERENCES family (id) DEFERRABLE NOT NULL,
    parent_2_fam uuid REFERENCES family (id) DEFERRABLE NOT NULL,
    PRIMARY KEY (id)
) INHERITS (element);
CREATE INDEX f_matrix_row_animal_fam_idx on f_matrix_row (animal_fam);
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON f_matrix_row FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON f_matrix_row FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE f_row_val
(
    matrix_row uuid REFERENCES f_matrix_row (id) DEFERRABLE NOT NULL,
    animal_fam uuid REFERENCES family (id) DEFERRABLE NOT NULL,
    val float NOT NULL,
    PRIMARY KEY (id)
) INHERITS (element);
CREATE INDEX f_row_val_animal_fam_idx on f_row_val (animal_fam);
CREATE OR REPLACE TRIGGER element_pre_insert_t BEFORE INSERT ON f_row_val FOR EACH ROW EXECUTE PROCEDURE element_pre_insert();
CREATE OR REPLACE TRIGGER element_pre_update_t BEFORE UPDATE ON f_row_val FOR EACH ROW EXECUTE PROCEDURE element_pre_update();

CREATE TABLE version
(
    major int NOT NULL,
    minor int NOT NULL,
    patch int NOT NULL
);

INSERT INTO version (major, minor, patch)
VALUES (0, 0, 1);
