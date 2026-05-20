-- Minamo (水面) — pgvector Extension
-- Enable vector similarity search for future embedding-based features

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE notes ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);
