ALTER TABLE family_note DROP CONSTRAINT family_note_family_fkey;
ALTER TABLE family_note ADD CONSTRAINT family_note_family_fkey FOREIGN KEY (family) REFERENCES family(id) ON DELETE CASCADE;