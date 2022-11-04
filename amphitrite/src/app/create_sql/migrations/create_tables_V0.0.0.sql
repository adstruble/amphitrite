CREATE EXTENSION pgcrypto;
CREATE USER amphiadmin WITH ENCRYPTED_PASSWORD 'amphiadmin' CONNECTION LIMIT 10;
CREATE DATABASE amphitrite WITH OWNER amphiadmin;
\c amphitrite
CREATE USER amphiuser WITH ENCRYPTED_PASSWORD 'amphiuser' CONNECTION LIMIT 20;
ALTER DEFAULT PRIVILEGES FOR USER amphiuser IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO amphiuser;
CREATE USER amphireadonly WITH ENCRYPTED_PASSWORD 'amphireadonly' CONNECTION LIMIT 20;
ALTER DEFAULT PRIVILEGES FOR USER amphireadonly IN SCHEMA public GRANT SELECT ON TABLES TO amphireadonly;

CREATE SCHEMA amphitrite;

CREATE TYPE sex AS ENUM ('f', 'm');

CREATE TABLE amphitrite.element {
    id SERIAL PRIMARY KEY,
    created_at timestamp,
    last_modified timestamp,
    last_modified_by int NOT NULL REFERENCES amphitrite.user(id)
}

CREATE TABLE amphitrite.family {
    sibling_birth_year int NOT NULL,
    tag int NOT NULL, // Should this be text?'
    float di, // This can be calculated, but probably want to store it
    bool do_not_cross NOT NULL DEFAULT FALSE // This is to be indicated manually by crosser,
    PRIMARY KEY (id)
} INHERITS (amphitrite.element);

CREATE TABLE amphitrite.fish (
    sex sex NOT NULL,
    box int,
    spawn_year int,
    alive bool NOT NULL,
    sibling_in int REFERENCES amphitrite.family (id),
    PRIMARY KEY (id)
) INHERITS (amphitrite.element);

CREATE TABLE amphitrite.refuge_tag {
    tag text[] NOT NULL,
    date_tagged timestamp NOT NULL,
    date_untagged timestamp,
    int fish NOT NULL REFERENCES amphitrite.fish(id),
    PRIMARY KEY (id)
    } INHERITS (amphitrite.element);
CREATE INDEX tagged_fish_idx on amphitrite.refuge_tag (fish);

CREATE TABLE amphitrite.crossed_with {
    female      int NOT NULL PRIMARY KEY REFERENCES amphitrite.fish (id),
    male        int NOT NULL PRIMARY KEY REFERENCES amphitrite.fish (id),
    cross_date  timestamp NOT NULL PRIMARY KEY,
    parents_of  int REFERENCES amphitrite.family(id),
    PRIMARY KEY (id)
    } INHERITS (amphitrite.element);

CREATE TABLE amphitrite.notes {
    text text,
    PRIMARY KEY (id)
} INHERITS (amphitrite.element);

CREATE TABLE amphitrite.user {
    id SERIAL PRIMARY KEY,
    username (100) NOT NULL,
    password varchar(100) NOT NULL,
    enabled bool NOT NULL,
    PRIMARY KEY (id)
} INHERITS (amphitrite.element);

CREATE TABLE amphitrite.version {
    major int NOT NULL;
    minor int NOT NULL;
    patch int NOT NULL;
};

INSERT INTO amphitrite.version (major, minor, patch) VALUES (0, 0, 0);
