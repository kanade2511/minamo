# Minamo — Supabase セットアップ手順

## 1. プロジェクトを作成

1. https://supabase.com/dashboard にログイン
2. 「New project」をクリック
3. 設定:
   - **Name:** `minamo`
   - **Database Password:** 生成 or 自分で設定（控えておく）
   - **Region:** Tokyo (apitokyo) 推奨
   - **Pricing Plan:** Free でOK
4. 「Create new project」をクリック
5. 完了まで1〜2分待つ

## 2. マイグレーションSQLを実行

1. プロジェクトのダッシュボードが開いたら、左メニューから **「SQL Editor」** をクリック
2. 「New query」をクリック
3. 以下の内容をコピペして実行:

※ファイルからコピーする場合:
  `supabase/migrations/001_initial_schema.sql` を開いて中身を全部コピーして貼り付ける

```sql
-- Minamo (水面) — Initial Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE themes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question   TEXT NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE entries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id   UUID REFERENCES themes(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE insights (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id   UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dialogue   JSONB NOT NULL,
  insight    TEXT NOT NULL,
  tags       TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE entries ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED;

CREATE INDEX entries_search_idx ON entries USING GIN(search_vector);

CREATE INDEX entries_user_id_idx ON entries(user_id);
CREATE INDEX entries_created_at_idx ON entries(created_at DESC);
CREATE INDEX insights_entry_id_idx ON insights(entry_id);
CREATE INDEX insights_user_id_idx ON insights(user_id);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read themes"
  ON themes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read own entries"
  ON entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own insights"
  ON insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights"
  ON insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights"
  ON insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights"
  ON insights FOR DELETE USING (auth.uid() = user_id);
```

4. 「Run」をクリック
5. 成功したら "Success. No rows returned" と表示される

## 3. Magic Link 認証を有効化

1. 左メニューから **「Authentication」→「Providers」** をクリック
2. 「Email」をクリック
3. 「Enable Sign ups」をONにする
4. 「Confirm only (magic link)」にチェックを入れる
5. 「Save」をクリック

## 4. APIキーを取得

1. 左メニューから **「Project Settings」→「API」** をクリック
2. 以下の2つを控える:
   - **Project URL**（`https://xxxxxxxxxxxx.supabase.co`）
   - **anon public key**（`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`）

## 5. .env.local に設定

`/Users/sou/Desktop/dev/minamo/.env.local` をエディタで開いて、控えた値で書き換える:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 6. 動作確認

```bash
cd ~/Desktop/dev/minamo
npm run dev
```

ブラウザで http://localhost:3000 にアクセス → ログインページが表示される → メールアドレスを入力するとマジックリンクが届く
