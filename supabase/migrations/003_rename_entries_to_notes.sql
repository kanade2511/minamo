-- Minamo (水面) — entries → notes リネームマイグレーション

-- 1. insights.note_id の外部キー制約を一旦削除
ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_entry_id_fkey;

-- 2. insights のカラム名をリネーム
ALTER TABLE insights RENAME COLUMN entry_id TO note_id;

-- 3. entries テーブルを notes にリネーム（RLSポリシーやインデックスも自動追従）
ALTER TABLE entries RENAME TO notes;

-- 4. insights の外部キーを notes に張り直し
ALTER TABLE insights
  ADD CONSTRAINT insights_note_id_fkey
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;

-- 5. entries テーブルのポリシー名をリネーム
ALTER POLICY "Users can read own entries" ON notes RENAME TO "Users can read own notes";
ALTER POLICY "Users can insert own entries" ON notes RENAME TO "Users can insert own notes";
ALTER POLICY "Users can update own entries" ON notes RENAME TO "Users can update own notes";
ALTER POLICY "Users can delete own entries" ON notes RENAME TO "Users can delete own notes";

-- 6. insights の旧インデックスを削除して新しい名前に
DROP INDEX IF EXISTS insights_entry_id_idx;
CREATE INDEX IF NOT EXISTS insights_note_id_idx ON insights(note_id);
