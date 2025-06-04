ALTER TABLE requested_cross ADD COLUMN known_duplicate bool NOT NULL DEFAULT false;
ALTER TABLE requested_cross DROP CONSTRAINT unique_requested_cross_parents_type;
ALTER TABLE requested_cross ADD CONSTRAINT unique_requested_cross_parents_type UNIQUE(parent_f_fam, parent_m_fam, supplementation, known_duplicate);



UPDATE version set (major, minor, patch) = (0, 1, 0);