# Minamo — Design Concept vs. Implementation Gap Analysis

> Generated: 2026-05-21
> Based on DESIGN_CONCEPT.md (v1.0, May 2026) vs. current source at `/Users/sou/Desktop/dev/minamo`

---

## Phase 1 — Core Loop (概ね完了)

| # | Item | Status | Details |
|---|------|--------|---------|
| 1 | Project scaffolding (Next.js + Tailwind + Supabase) | ✅ Complete | Next.js 16.2.6, Tailwind v4, Supabase SSR |
| 2 | Database schema + RLS (themes, notes, insights) | ✅ Complete | 3 migrations applied (001 schema, 002 theme_id TEXT, 003 rename entries→notes) |
| 3 | Minamo Auth (Magic Link) | ⚠️ Differs | DESIGN says "Magic Link"; implemented as **email + password** (`signInWithPassword` / `signUp`). Auth callback route exists for code exchange. Supabase Auth middleware protects app routes. |
| 4 | Today's question page + editor | ✅ Complete | `NoteEditor` component with question/free mode, editor, save flow |
| 5 | Timeline view | ✅ Complete | `TimelineList` component, ordered by `created_at DESC`, shows previews + insights |
| 6 | LLM analysis pipeline (background after entry save) | ⚠️ Partial | Analysis exists (`NoteAnalysis` component + `/api/analyze`) but is **client-side debounced while typing**, not background fire-and-forget on save. Analysis is ephemeral — **not stored in database**. |
| 7 | Seed themes | ✅ Complete | 50 questions in `seed/questions.json`, loaded by `getDailyQuestion()` via deterministic hash |

---

## Phase 2 — Depth (ほとんど未実装)

| # | Item | Status | Details |
|---|------|--------|---------|
| 8 | **Theme management CRUD** | ❌ Missing | No admin UI or API for creating/editing/deleting themes. Questions are hardcoded in `seed/questions.json`. The `themes` table exists but is **never written to or read by the app** — the app uses the JSON file directly. |
| 9 | **Mood/emotion tagging** | ⚠️ Partial | Emotion analysis IS performed client-side (`NoteAnalysis` component) but results are **not persisted**. The DESIGN envisions persistent tags stored alongside notes — currently analysis disappears on page reload. The `insights.tags` column exists but is only populated with empty array `[]` on save. |
| 10 | Search & filter | ✅ Complete | Full-text search via `tsvector` + `notes.search_vector` GIN index + `TimelineSearch` component with `?q=` query param |
| 11 | **Entry detail with LLM analysis display** | ⚠️ Incomplete | `/app/timeline/[id]` exists but shows only note content + insights from Mirror dialogue. The **emotion analysis, keywords, and summary** from LLM analysis are NOT displayed on the detail page — they're only visible in the editor sidebar while writing. |

---

## Phase 3 — Insights (全て未実装)

| # | Item | Status | Details |
|---|------|--------|---------|
| 12 | **Weekly/monthly summary generation** | ❌ Missing | The `summaries` table exists in the schema but is **never queried or inserted**. No background job, no cron trigger, no UI. |
| 13 | **Insights dashboard (emotion trends, theme frequency)** | ❌ Missing | No dashboard page, no charts, no trend visualization. Data needed for this (emotions per note) isn't even stored. |
| 14 | **Semantic search ("How have I felt about X?")** | ❌ Missing | **pgvector extension is never enabled.** No embedding generation, no vector column on `notes`, no similarity search. Despite DESIGN listing `text-embedding-3-small` and pgvector as core tech stack. |
| 15 | **Question-answering over past entries (RAG)** | ❌ Missing | No RAG pipeline. The Mirror deep-dive only operates on a **single note**, not across all past entries. |

---

## Architecture-Level Gaps

### 1. LLM Provider Abstraction (中途半端)

DESIGN: "Abstracted (configurable provider; default TBD)"

- ✅ `LLMProvider` interface and `createOpenAIProvider` exist in `lib/llm/types.ts` + `lib/llm/openai.ts`
- ✅ Used by `/api/deep-dive` (Mirror chat)
- ❌ `/api/analyze` (NoteAnalysis) uses **raw OpenAI client directly**, ignoring the abstraction
- ❌ No Anthropic, local, or other provider implementations
- ❌ Two routes use different models: `/api/analyze` uses `openai/gpt-oss-20b:free`, `/api/deep-dive` uses `gpt-4o-mini`

### 2. pgvector / Embeddings (完全未使用)

DESIGN: "pgvector (on Supabase, no extra infra)" + "text-embedding-3-small"

- ❌ `CREATE EXTENSION vector` never executed in any migration
- ❌ No embedding column on `notes` table
- ❌ No embedding generation logic in codebase
- ❌ No similarity search queries

### 3. Background Analysis Pipeline (未実装)

DESIGN: "Fire-and-forget on entry save. User doesn't wait for LLM."

- ❌ Current analysis is **client-side** (`useEffect` in `NoteAnalysis`), triggered while typing with 1.5s debounce
- ❌ Not triggered on save; only while user is actively editing
- ❌ Results ephemeral — not stored, not available for batch/trend analysis
- ❌ No server-side hook on note creation to fire analysis

### 4. Data Model Discrepancies

- `themes` table: exists but unused by app code (questions come from JSON)
- `summaries` table: exists in schema, zero references in codebase
- `notes.search_vector`: exists for full-text search (used)
- No vector embedding column (missing)
- No `entry_analyses` table (mentioned in DESIGN's LLM architecture diagram as storing emotions/themes/keywords)

### 5. Auth: Magic Link vs. Email+Password

DESIGN specifies "Magic Link" auth. Current implementation uses email + password. This isn't necessarily a gap if intentional, but worth noting.

---

## Page Structure Comparison

| Route | DESIGN | Current | Status |
|-------|--------|---------|--------|
| `/` | Landing page (hero, features, CTA) | ✅ Landing page with hero, features, usage sections | Complete |
| `/login` | ログイン/新規登録 (email+password) | ✅ Login/signup with mode toggle, `?mode=signup` param | Complete |
| `/auth/callback` | Supabase Auth コールバック | ✅ Code exchange for session | Complete |
| `/app` | Today's question + editor | ✅ Question/free mode selector + editor + sidebar analysis | Complete |
| `/app/explore` | ノート一覧 → Mirror対話へ進む | ✅ List of notes with preview → detail link | Complete |
| `/app/explore/[id]` | Single entry + Mirror chat + 感情分析 | ✅ Note display + InlineConversation + NoteAnalysis sidebar | Complete |
| `/app/timeline` | Entry history + 全文検索 | ✅ Timeline with search, insight cards, delete | Complete |
| `/app/timeline/[id]` | Entry detail + 保存済みInsight表示 | ✅ Note content + InsightCard + full dialogue expandable | Complete |

**Note**: All page routes from DESIGN are implemented. The gaps are in functionality depth, not routing.

---

## Auth Flow Comparison

| Button | DESIGN | Current | Status |
|--------|--------|---------|--------|
| 「ログイン」未ログイン→`/login`, ログイン済み→`/app` | ✅ Implemented in LandingPage `handleAuthRedirect` | Complete |
| 「始める」未ログイン→`/login?mode=signup`, ログイン済み→`/app` | ✅ Same flow | Complete |
| 「無料ではじめる」未ログイン→`/login?mode=signup`, ログイン済み→`/app` | ✅ Same flow | Complete |
| Auto-redirect しない | ✅ Not done | Complete |
| Login page `?mode=signup` | ✅ Used | Complete |
| ログイン/新規登録 トグル | ✅ Present | Complete |

---

## Summary of Priority Gaps (優先度順)

### 🔴 Priority 1 — Core Experience Blockers

These are gaps that directly impact the core value proposition of the app.

1. **Emotion analysis results not persisted** (Phase 2 #9)
   - Analysis runs while typing but results vanish on refresh
   - No database storage for emotion/sentiment/keyword data
   - **Impact**: Trend analysis, dashboard, and summaries are impossible without this foundational data
   - **Fix**: Create `entry_analyses` table or add columns to `notes`, save analysis results server-side on note save

2. **No background analysis on note save** (Phase 1 #6)
   - Analysis only happens client-side while editing
   - **Impact**: Notes saved without editing get no analysis; no analysis triggered for imported/API-created notes
   - **Fix**: Trigger LLM analysis in `createNote` server action (fire-and-forget via `fetch()` or queue)

3. **LLM provider abstraction inconsistent**
   - `/api/analyze` bypasses the provider abstraction
   - Two different model names hardcoded
   - **Impact**: Configuration is split, provider swap requires changes in multiple files
   - **Fix**: Refactor `/api/analyze` to use `createOpenAIProvider` with env-configured model

### 🟡 Priority 2 — Phase 2 Depth Features

4. **Theme management CRUD** (Phase 2 #8)
   - Questions are hardcoded in JSON; no way to add/customize via UI
   - **Impact**: Users can't personalize prompts; admins can't add seasonal themes
   - **Fix**: Admin UI for `themes` table CRUD; load questions from DB instead of JSON

5. **Entry detail lacks analysis display** (Phase 2 #11)
   - `/app/timeline/[id]` doesn't show emotions, keywords, or summary
   - **Impact**: Users can't review past analysis results
   - **Fix**: Display emotion bars, keywords, sentiment on detail page (requires #1 first)

### 🟠 Priority 3 — Phase 3 Insights (Value-Add)

6. **Weekly/monthly summary generation** (Phase 3 #12)
   - The entire `summaries` table is unused
   - **Impact**: No periodic reflection reports, a key feature in the DESIGN core experience
   - **Fix**: Cron job / serverless function iterating user's notes, calling LLM for period summary, storing in `summaries`

7. **Insights dashboard** (Phase 3 #13)
   - No emotion trends, theme frequency, or visualization
   - **Impact**: Users can't see their emotional patterns over time
   - **Fix**: Dashboard page with charts; requires #1 (persisted analysis data)

8. **Semantic search / pgvector** (Phase 3 #14)
   - No embeddings, no vector search
   - **Impact**: Can't search notes by concept or feeling ("How have I felt about X?")
   - **Fix**: Enable pgvector, add embedding column, generate embeddings on save, implement cosine similarity search

9. **Question-answering over past entries (RAG)** (Phase 3 #15)
   - Mirror only chats about one note at a time
   - **Impact**: Can't ask cross-entry questions ("What patterns do I see?")
   - **Fix**: RAG pipeline using vector search results as context for LLM

---

## Recommendations

### Immediate (1-2 days)
1. **Persist analysis results** — store emotions/sentiment/keywords in DB when note is saved
2. **Trigger analysis on save** — move from client-side-only to server-side fire-and-forget
3. **Unify LLM configuration** — refactor `/api/analyze` to use the abstracted provider

### Short-term (1 week)
4. **Display analysis on detail page** — emotions, keywords, summary on `/app/timeline/[id]`
5. **Theme CRUD** — simple admin interface to manage `themes` table
6. **Enable pgvector + embedding generation** — foundation for Phase 3

### Medium-term (2-4 weeks)
7. **Weekly/monthly summaries** — period-based batch LLM analysis
8. **Insights dashboard** — emotion trends, theme frequency charts
9. **Semantic search** — vector similarity for concept-based search
10. **Cross-entry RAG** — Mirror that can reference all past entries

---

*Analysis of 18 source files, 3 migrations, 1 seed file, and DESIGN_CONCEPT.md v1.0.*
