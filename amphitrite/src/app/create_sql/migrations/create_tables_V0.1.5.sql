CREATE INDEX IF NOT EXISTS pc_female_idx ON possible_cross(female);
CREATE INDEX IF NOT EXISTS pc_male_idx ON possible_cross(male);
CREATE INDEX IF NOT EXISTS rc_parent_m_fam_idx ON requested_cross(parent_m_fam);
CREATE INDEX IF NOT EXISTS rc_parent_f_fam_idx ON requested_cross(parent_f_fam);
CREATE INDEX IF NOT EXISTS rc_parent_m_idx ON requested_cross(parent_m);
