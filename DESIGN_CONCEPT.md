# Minamo (水面) — Design Concept

> 自分を知る、毎日少しずつ。

## Overview

Minamo is a guided self-reflection journal with AI-powered analysis. 
Users respond to daily prompts, building a personal archive of thoughts over time. 
LLM processes each entry to extract emotions, themes, and patterns, 
surfacing insights the user couldn't see on their own.

The name **水面 (Minamo)** — "water surface" — evokes reflection, stillness, 
and the ripples of daily thought. Like a still pond, the app reflects the user's 
inner self back to them.

## Design Philosophy: "静かな水面"

Inspired by Nordic minimalism and modernist functional beauty:

- **Silence** — no unnecessary UI elements. Writing is the only focus.
- **Whitespace as language** — generous margins, airy layouts, like a high-quality notebook.
- **Typography first** — the written word is the hero. Clean sans-serif or warm serif.
- **Monochrome + 1 accent** — off-white base, dark text, one calm accent color (ink blue or charcoal).
- **No decorative noise** — no gradients, no heavy shadows, no animations that don't serve the content.
- **Responsive but desktop-first** — writing on a big canvas feels better.

## Core Experience

```
毎日:
  ┌─────────────────────────────────────────┐
  │  今日の問い                              │
  │  "今日、どんなことに心が動いた？"          │
  │                                         │
  │  ┌─────────────────────────────────────┐ │
  │  │                                     │ │
  │  │  (自由記述エリア — 静かな白い余白)    │ │
  │  │                                     │ │
  │  └─────────────────────────────────────┘ │
  │                                         │
  │  [ 保存 ]                                │
  └─────────────────────────────────────────┘
          ↓ (バックグラウンド)
  LLM分析:
    • 感情を抽出 → タグ化
    • テーマを抽出 → カテゴリ化
    • エンベディング生成 → ベクトルDB保存
          ↓ (蓄積)
  週末 / 月末:
    LLMが期間内の全エントリを横断
    → 「今週のあなた」サマリー
    → 思考パターン・感情の推移
    → 気づき・発見
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (TypeScript) |
| Database | Supabase (Postgres) |
| Vector DB | pgvector (on Supabase, no extra infra) |
| Auth | Supabase Auth (Magic Link) |
| LLM API | Abstracted (configurable provider; default TBD) |
| Embedding | text-embedding-3-small (or equiv.) |
| Styling | Tailwind CSS |
| Deploy | Vercel |

## Data Model

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Themes (questions/prompts for daily reflection)
CREATE TABLE themes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL,
  category   TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal notes
CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  theme_id   UUID REFERENCES themes(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deep-dive insights (result of LLM conversation)
CREATE TABLE insights (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  dialogue   JSONB NOT NULL,
  insight    TEXT NOT NULL,
  tags       TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Periodic summaries (weekly / monthly)
CREATE TABLE summaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) NOT NULL,
  period       TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  content      TEXT NOT NULL,
  insights     TEXT[],
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

## RLS Policies

```sql
-- Notes: users can only access their own
CREATE POLICY "Users can CRUD own notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id);

-- Insights: ditto
CREATE POLICY "Users can CRUD own insights"
  ON insights FOR ALL
  USING (auth.uid() = user_id);

-- Themes: all authenticated users can read
CREATE POLICY "Anyone can read themes"
  ON themes FOR SELECT
  TO authenticated
  USING (true);
```

## Page Structure

| Route | Page |
|-------|------|
| `/` | Landing page (hero, features, CTA) — 未認証ユーザー向け |
| `/login` | ログイン / 新規登録 (email + password) |
| `/auth/callback` | Supabase Auth コールバック |
| `/app` | Today's question + editor (認証必須) |
| `/app/explore` | ノート一覧 → Mirror対話へ進む |
| `/app/explore/[id]` | Single entry detail + Mirror chat + 感情分析 |
| `/app/timeline` | Entry history (chronological + 全文検索) |
| `/app/timeline/[id]` | Single entry detail + 保存済みInsight表示 |

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
[Client] → Server Action → [Next.js]
                              │
                    ┌─────────┴──────────┐
                    ▼                      ▼
            Supabase (save entry)    LLM API (analyze)
                                         │
                              ┌──────────┴──────────┐
                              ▼                      ▼
                        entry_analyses           pgvector
                        (emotions, themes,       (embeddings
                         summary, keywords)       for search)
```

- **Sync or background?** Fire-and-forget on entry save. User doesn't wait for LLM.
- **Provider abstraction:** Interface with swapable implementation (OpenAI, Anthropic, local).
- **Vector search:** Similar entries by cosine similarity on embeddings.

## Development Phases

### Phase 1 — Core Loop
1. Project scaffolding (Next.js + Tailwind + Supabase)
2. Database schema + RLS (themes, entries)
3. Minamo Auth (Magic Link)
4. Today's question page + editor
5. Timeline view
6. LLM analysis pipeline (background after entry save)
7. Seed themes

### Phase 2 — Depth
8. Theme management CRUD
9. Mood/emotion tagging
10. Search & filter
11. Entry detail with LLM analysis display

### Phase 3 — Insights
12. Weekly/monthly summary generation
13. Insights dashboard (emotion trends, theme frequency)
14. Semantic search ("How have I felt about X?")
15. Question-answering over past entries (RAG)

## Name Origin

**水面 (Minamo)** — the surface of a body of water.

> 水面は自分を映す鏡であり、日々の思考が波紋となって広がる場所でもある。
> その下の深層——気づかないうちに抱いている感情や思考パターンを、
> AIという灯りで照らし出す。

---

*Design Concept v1.0 — May 2026*
