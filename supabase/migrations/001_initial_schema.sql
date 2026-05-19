-- Minamo (水面) — Initial Schema
--
-- ============================================
-- TABLES
-- ============================================

-- Themes (questions/prompts for daily reflection)
CREATE TABLE themes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal notes
CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id   TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deep-dive insights (result of LLM conversation)
CREATE TABLE insights (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dialogue   JSONB NOT NULL,
  insight    TEXT NOT NULL,
  tags       TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FULL-TEXT SEARCH
-- ============================================

ALTER TABLE notes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED;

CREATE INDEX notes_search_idx ON notes USING GIN(search_vector);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX notes_user_id_idx ON notes(user_id);
CREATE INDEX notes_created_at_idx ON notes(created_at DESC);
CREATE INDEX insights_note_id_idx ON insights(note_id);
CREATE INDEX insights_user_id_idx ON insights(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Themes: all authenticated users can read
CREATE POLICY "Anyone can read themes"
  ON themes FOR SELECT
  TO authenticated
  USING (true);

-- Notes: users can CRUD own notes only
CREATE POLICY "Users can read own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Insights: users can CRUD own insights only
CREATE POLICY "Users can read own insights"
  ON insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON insights FOR DELETE
  USING (auth.uid() = user_id);
