CREATE SCHEMA amphitrite;

CREATE TYPE sex AS ENUM ('f', 'm');

CREATE TABLE amphitrite.element {
    id SERIAL PRIMARY KEY,
    created_at timestamp,
    last_modified timestamp,
    last_modified_by
}

CREATE TABLE amphitrite.family {
    id SERIAL PRIMARY KEY,
    sibling_birth_year int NOT NULL,
    tag int NOT NULL, // Should this be text?'
    float di, // This can be calculated, but probably want to store it
    bool do_not_cross NOT NULL DEFAULT FALSE // This is to be indicated manually by crosser
}

CREATE TABLE amphitrite.fish (
    id SERIAL PRIMARY KEY,
    sex sex NOT NULL,
    box int,
    spawn_year int,
    alive bool NOT NULL,
    sibling_in int REFERENCES amphitrite.family (id)
);

CREATE TABLE amphitrite.refuge_tag {
    id SERIAL PRIMARY KEY,
    tag text[] NOT NULL,
    date_tagged timestamp NOT NULL,
    date_untagged timestamp,
    int fish NOT NULL REFERENCES amphitrite.fish(id)
};
CREATE INDEX tagged_fish_idx on amphitrite.refuge_tag (fish);

CREATE TABLE amphitrite.crossed_with {
    female      int NOT NULL PRIMARY KEY REFERENCES amphitrite.fish (id),
    male        int NOT NULL PRIMARY KEY REFERENCES amphitrite.fish (id),
    cross_date  timestamp NOT NULL PRIMARY KEY,
    parents_of  int REFERENCES amphitrite.family(id)
}

CREATE TABLE amphitrite.notes {
    id SERIAL PRIMARY KEY,
    text text,

}

CREATE TABLE amphitrite.user {
    
}



