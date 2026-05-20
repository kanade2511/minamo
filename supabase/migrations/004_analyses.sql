-- Minamo (水面) — Note Analyses
-- Stores LLM-based sentiment/emotion analysis results for each note
--
-- ============================================
-- TABLE
-- ============================================

CREATE TABLE note_analyses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotions   JSONB NOT NULL,
  sentiment  TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  keywords   TEXT[] DEFAULT '{}',
  summary    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX note_analyses_note_id_idx ON note_analyses(note_id);
CREATE INDEX note_analyses_user_id_idx ON note_analyses(user_id);
CREATE INDEX note_analyses_created_at_idx ON note_analyses(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE note_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analyses"
  ON note_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON note_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON note_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON note_analyses FOR DELETE
  USING (auth.uid() = user_id);
