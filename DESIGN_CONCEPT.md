# Minamo (水面) — Design Concept

> 自分を知る、毎日少しずつ。

## Overview

Minamo is a guided self-reflection journal with AI-powered analysis.
Users respond to daily prompts, building a personal archive of thoughts over time.
LLM processes each note to extract emotions, themes, and patterns,
surfacing insights the user couldn't see on their own.

The name **水面 (Minamo)** — "water surface" — evokes reflection, stillness,
and the ripples of daily thought. Like a still pond, the app reflects the user's
inner self back to them.

## Design Philosophy: "静かな水面"

Inspired by Nordic minimalism and modernist functional beauty:

- **Silence** — no unnecessary UI elements. Writing is the only focus.
- **Whitespace as language** — generous margins, airy layouts, like a high-quality notebook.
- **Typography first** — the written word is the hero. Clean sans-serif (Geist).
- **Monochrome + 1 accent** — white base, dark text (#17171c), steel blue accent (#4a6fa5).
- **No decorative noise** — no gradients, no heavy shadows, no animations that don't serve the content.
- **Responsive but desktop-first** — writing on a big canvas feels better.

## Core Experience

```
毎日:
  ┌─────────────────────────────────────────┐
  │  今日の問い  or  自由記述                 │
  │  ┌─────────────────────────────────────┐ │
  │  │  (エディタ — 静かな白い余白)          │ │
  │  │                                      │ │
  │  └─────────────────────────────────────┘ │
  │                                         │
  │  [ 保存 ] → 自動LLM分析 → DB保存         │
  └─────────────────────────────────────────┘
          ↓ (蓄積)
  インサイトページ:
    • 執筆アクティビティカレンダー（直近14日）
    • ムードトレンド（週間/月間の感情推移グラフ）
          ↓
  Mirrorとの対話（「探る」タブ）:
    • 保存したノートを題材にAIが深掘り対話
    • 対話内容は insights テーブルに保存可能
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (TypeScript, Turbopack) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email + password) |
| LLM API | OpenRouter (configurable via env) |
| Styling | Tailwind CSS v4 |
| Analysis | Biome (linter + formatter) |
| Analytics | Vercel Analytics |
| Deploy | Vercel |

## Data Model

```sql
-- Themes (questions/prompts for daily reflection)
-- NOTE: Currently loaded from seed/questions.json, not from this table
CREATE TABLE themes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal notes
CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  theme_id   TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Full-text search vector (auto-generated from content)
ALTER TABLE notes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED;
CREATE INDEX notes_search_idx ON notes USING GIN(search_vector);

-- Deep-dive insights (result of Mirror conversation)
CREATE TABLE insights (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  dialogue   JSONB NOT NULL,
  insight    TEXT NOT NULL,
  tags       TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LLM analysis results (auto-saved on note creation)
CREATE TABLE note_analyses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  emotions   JSONB NOT NULL,
  sentiment  TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  keywords   TEXT[],
  summary    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## RLS Policies

```sql
-- Notes: users can only access their own
CREATE POLICY "Users can read own notes"
  ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE USING (auth.uid() = user_id);

-- Insights: ditto
CREATE POLICY "Users can read own insights"
  ON insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights"
  ON insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights"
  ON insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights"
  ON insights FOR DELETE USING (auth.uid() = user_id);

-- Note analyses: ditto
CREATE POLICY "Users can read own note_analyses"
  ON note_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own note_analyses"
  ON note_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Themes: all authenticated users can read
CREATE POLICY "Anyone can read themes"
  ON themes FOR SELECT TO authenticated USING (true);
```

## Page Structure

| Route | Page |
|-------|------|
| `/` | Landing page (hero, features, CTA) — 未認証ユーザー向け |
| `/login` | ログイン / 新規登録 (email + password + `?mode=signup`) |
| `/auth/callback` | Supabase Auth コールバック |
| `/app` | Today's question / free editor + 執筆アクティビティカレンダー |
| `/app/explore` | ノート一覧 → Mirror対話へ進む |
| `/app/explore/[id]` | ノート詳細 + Mirror対話 + ノート分析 |
| `/app/timeline` | 全ノート一覧 (chronological + 全文検索) |
| `/app/timeline/[id]` | ノート詳細 + 保存済みInsight表示 + 分析結果 |
| `/app/insights` | 執筆アクティビティカレンダー + ムードトレンド |
| `/api/analyze` | LLM感情分析API (POST) |
| `/api/deep-dive` | Mirror対話API (POST, streaming) |
| `/api/export` | 全データJSONエクスポート (GET) |

### 認証状態による振り分け（ランディングページ）

ランディングページ (`/`) のボタンはクリック時に `supabase.auth.getSession()` で認証状態を判定し、遷移先を振り分ける:

| ボタン | 未ログイン時 | ログイン済み時 |
|--------|-------------|---------------|
| 「ログイン」（Nav / Hero内） | `/login` (ログインモード) | `/app` |
| 「始める」（Nav） | `/login?mode=signup` (新規登録モード) | `/app` |
| 「無料ではじめる」（Hero / 下部CTA） | `/login?mode=signup` (新規登録モード) | `/app` |

- 自動リダイレクトは行わない。認証済みユーザーでもランディングページを閲覧できる。
- ログインページは `?mode=signup` クエリパラメータで初期モードを切り替え可能。
- 画面上の「ログイン/新規登録」トグルでいつでもモード変更可能。

## LLM Integration Architecture

```
[Client] → Server Action / API Route → [Next.js]
                              │
                    ┌─────────┴──────────┐
                    ▼                      ▼
            Supabase (save note)     OpenRouter (analyze / deep-dive)
                                         │
                              ┌──────────┴──────────┐
                              ▼                      ▼
                        note_analyses           Mirror conversation
                        (emotions,              (streaming response
                         sentiment,              → insights table)
                         keywords, summary)
```

- **Analysis:** Fire-and-forget on note save. `createNote()` calls `analyzeText()` and saves result to `note_analyses`. Non-blocking on failure.
- **Mirror:** Streaming conversation via `/api/deep-dive`. User can save the dialogue as an insight.
- **Provider:** OpenRouter with configurable model via `LLM_MODEL` env var.
- **No embeddings / vector search** — currently not implemented (future Phase 3).

## Development Phases

### Phase 1 — Core Loop ✅ (Complete)
1. ✅ Project scaffolding (Next.js + Tailwind + Supabase)
2. ✅ Database schema + RLS (themes, notes, insights, summaries)
3. ✅ Auth (email + password + magic link)
4. ✅ Today's question page + editor
5. ✅ Timeline view + full-text search
6. ✅ LLM analysis pipeline (auto on note save, persisted to DB)
7. ✅ Seed questions (50 questions in seed/questions.json)

### Phase 2 — Depth ✅ (Complete)
8. ✅ Avatar upload (crop → WebP → compress → Supabase Storage)
9. ✅ Mood/emotion analysis (real-time editor + auto-save)
10. ✅ Search & filter (full-text search on timeline)
11. ✅ Note detail with LLM analysis display (timeline detail + explore)
12. ✅ Custom SMTP (Resend) for transactional emails
13. ✅ Magic Link authentication
14. ✅ Password reset (email-based)
15. ✅ Email change (2-step verification: old email → new email)

### Phase 3 — Insights 🟡 (Partially Complete)
16. ✅ Weekly summary generation
17. ✅ Insights dashboard (mood trend chart)
18. ❌ Semantic search / vector embeddings
19. ❌ Question-answering over past notes (RAG)

## Auth Flow

### Login
- Step 1: Enter email → Step 2: Choose "Send magic link" or "Enter password"
- Magic link sent via Resend SMTP (no Supabase credit usage)

### Signup
- Email + password only (magic link not available for new users)
- Confirmation email sent via Resend SMTP
- After confirmation, redirects to /auth/callback → /app

### Password Reset
- Settings page: "パスワードをリセット" button
- Sends reset email → link to /app/update-password
- Enter new password → confirm → update

### Email Change (2-step)
- Settings page: "メールアドレスを変更" button
- Step 1: Verification email to CURRENT address → link to /app/change-email?token=xxx
- Step 2: Enter new email → confirmation email to NEW address
- Step 3: Confirm → Admin API applies change

### Account Deletion
- Two-step confirmation (type "削除")
- Deletes: auth user, notes, analyses, insights, summaries, avatar from storage

## Name Origin

**水面 (Minamo)** — the surface of a body of water.

> 水面は自分を映す鏡であり、日々の思考が波紋となって広がる場所でもある。
> その下の深層——気づかないうちに抱いている感情や思考パターンを、
> AIという灯りで照らし出す。

---

*Design Concept v2.0 — May 2026*
