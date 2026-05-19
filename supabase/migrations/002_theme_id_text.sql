-- Change entries.theme_id from UUID FK to TEXT
-- (seed questions use string IDs like "seed-13")

ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_theme_id_fkey;
ALTER TABLE entries ALTER COLUMN theme_id TYPE TEXT;
