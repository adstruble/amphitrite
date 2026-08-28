-- Fish Care (husbandry / daily log) — first LFS species view.
-- Standalone table; does not reference existing delta smelt tables. Rows are imported per sheet
-- (facility + optional system + year) and replaced wholesale on re-import, so no history trigger.
CREATE TABLE fish_care
(
    facility         text NOT NULL,
    system           text,
    sheet_year       int  NOT NULL,
    obs_date         date,
    tank_id          text,
    carer            text,
    -- Water-quality readings are stored as text: source cells contain approximate values (e.g. '~5').
    temp             text,
    dissolved_oxygen text,
    salinity         text,
    ph               text,
    turbidity        text,
    ammonia          text,
    nitrite          text,
    nitrate          text,
    morts            int,
    notes            text,
    source           text,
    synced_at        timestamp,
    PRIMARY KEY (id)
) INHERITS (element);

-- Supports replace-per-sheet deletes keyed by (facility, system, year).
CREATE INDEX fish_care_sheet_idx ON fish_care (facility, system, sheet_year);
CREATE INDEX fish_care_obs_date_idx ON fish_care (obs_date);
