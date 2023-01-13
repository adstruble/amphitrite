CREATE USER amphiuser WITH ENCRYPTED PASSWORD 'amphiuser' CONNECTION LIMIT 20;
GRANT amphiuser to amphiadmin;
ALTER DEFAULT PRIVILEGES FOR USER amphiuser IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO amphiuser;
CREATE USER amphireadonly WITH ENCRYPTED PASSWORD 'amphireadonly' CONNECTION LIMIT 20;
GRANT amphireadonly to amphiadmin;
ALTER DEFAULT PRIVILEGES FOR USER amphireadonly IN SCHEMA public GRANT SELECT ON TABLES TO amphireadonly;

CREATE TYPE sex AS ENUM ('f', 'm');

CREATE TABLE element (
    id SERIAL PRIMARY KEY,
    created_at timestamp,
    last_modified timestamp
);

CREATE TABLE amphi_user (
    username varchar(100) NOT NULL,
    password varchar(100) NOT NULL,
    enabled bool NOT NULL,
    PRIMARY KEY (id)
) INHERITS (element);

ALTER TABLE element ADD COLUMN last_modified_by int NOT NULL REFERENCES amphi_user(id);

CREATE TABLE family (
    sibling_birth_year int NOT NULL,
    group_id int NOT NULL, -- TODO Should this be text? Do we even need it?'
    di float, -- This can be calculated, but probably want to store it
    do_not_cross bool NOT NULL DEFAULT FALSE, -- This is to be indicated manually by crosser,
    PRIMARY KEY (id)
) INHERITS (element);

CREATE TABLE fish (
    sex sex NOT NULL,
    box int,
    -- spawn_year int, -- TODO Isn't this same as sibling_birth_year, removing for now
    alive bool NOT NULL,
    sibling_in int REFERENCES family (id) NOT NULL,
    PRIMARY KEY (id)
) INHERITS (element);

CREATE TABLE gene (
    name varchar(100) NOT NULL,
    allele_1 char NOT NULL,
    allele_2 char NOT NULL,
    fish int REFERENCES fish(id) NOT NULL,
    PRIMARY KEY (name, fish)
)INHERITS (element);
CREATE INDEX gene_fish_idx on gene(fish);

CREATE TABLE refuge_tag (
    tag text[] NOT NULL, -- TODO can we put a length on this text field
    date_tagged timestamp NOT NULL,
    date_untagged timestamp,
    fish int NOT NULL REFERENCES fish(id),
    PRIMARY KEY (id)
    ) INHERITS (element);
CREATE INDEX tagged_fish_idx on refuge_tag (fish);

CREATE TABLE crossed_with (
    female      int NOT NULL REFERENCES fish (id),
    male        int NOT NULL REFERENCES fish (id),
    cross_date  timestamp NOT NULL,
    parents_of  int REFERENCES family(id),
    PRIMARY KEY (id)
    ) INHERITS (element);

CREATE TABLE notes (
    text text,
    PRIMARY KEY (id)
) INHERITS (element);

CREATE TABLE notes_element (
    note int REFERENCES notes(id),
    element int REFERENCES element(id)
);

CREATE TABLE version (
    major int NOT NULL,
    minor int NOT NULL,
    patch int NOT NULL
);

INSERT INTO version (major, minor, patch) VALUES (0, 0, 1);
