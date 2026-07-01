# Buddy — AI-Powered Study Workspace

Buddy is an AI-enabled product for students to write notes, organize coursework, generate summaries and flashcards, and study with a custom chat assistant grounded in their own content.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Supabase Auth with SSR cookie handling
- **Editor**: TipTap rich text editor (JSON content persisted in DB)
- **AI Models**: Google Gemini (`gemini-2.5-flash`) for generation + (`text-embedding-004`) for embeddings
- **Vector Search**: pgvector (`vector(768)`) + HNSW cosine index

## Core Student Features

- Create, edit, organize, pin, archive, import/export notes
- AI summaries with key points for any saved note
- AI flashcard-ready data model with spaced-review fields
- Custom study chatbot with optional note selection or automatic RAG retrieval

---

## AI Architecture Overview

Buddy uses two complementary AI pipelines:

1. **Note Understanding Pipeline** (summaries/key points)
2. **RAG Chat Pipeline** (retrieval-augmented study assistant)

### 1) Note Understanding Pipeline

When a student asks for a summary:

1. The app authenticates the user via Supabase.
2. The note is fetched from Postgres and ownership is verified.
3. TipTap JSON is converted to plain text.
4. Gemini (`gemini-2.5-flash`) generates:
   - `summary` (concise paragraph)
   - `key_points` (3-5 bullets)
5. Results are stored back in `notes.summary`, `notes.key_points`, and `notes.summary_word_count`.

This gives students a fast “revision mode” directly from their original notes.

### 2) Embedding + Retrieval (RAG) Pipeline

Buddy implements retrieval-augmented generation so chat answers can use a student’s own material.

#### Ingestion / Embedding

Implemented in `src/lib/embeddings.ts`:

- **Text extraction**: TipTap JSON -> plain text (`extractTextFromTipTap`)
- **Chunking**: sentence-aware chunking (`chunkText`, default 1000 chars)
- **Embedding model**: Gemini `text-embedding-004`
- **Batch support**: `generateEmbeddingsBatch` for multi-chunk ingestion

#### Storage

Implemented in `src/db/schema.ts`:

- `note_embeddings` table stores:
  - `note_id`, `user_id`
  - chunk `content`
  - `embedding` vector with **768 dimensions**
  - optional JSON `metadata`
- HNSW index configured with `vector_cosine_ops` for fast nearest-neighbor search

`drizzle/enable-pgvector.sql` enables the vector extension.

#### Retrieval

Implemented in `src/lib/rag-utils.ts`:

- Query text is embedded with `generateEmbedding`
- Similar chunks retrieved via cosine distance in SQL
- Similarity score computed as `1 - distance`
- Results are filtered by threshold (default `0.3`) and limited (default `5`)
- `buildRagContext` composes a bounded prompt context (default ~3000 chars)

#### RAG Response Generation

Implemented in `src/app/api/chat/route.ts`:

- If `contextNoteIds` are provided, chat uses those explicit notes
- Otherwise, it runs vector retrieval (`findSimilarNotes`) from the student’s note embeddings
- Retrieved context is injected into a system prompt
- Gemini (`gemini-2.5-flash`) generates an answer grounded in note context
- Chat messages and used context note IDs are stored in DB (`chat_messages`)

---

## Server-Side Processing Design

- **Auth boundary**: request-time user check via Supabase SSR
- **Data boundary**: Drizzle queries scoped by authenticated `user.id`
- **Persistence**:
  - Notes/folders/decks/flashcards in Postgres
  - Chat sessions/messages in Postgres
  - Embedding vectors in pgvector-enabled table

This keeps student data isolated per user and enables personalized AI responses.

## Next.js Features Used

- App Router (`src/app/*`)
- Route handlers for API endpoints (`src/app/api/*`)
- Server-side auth checks and redirects
- Client components for rich interactions (editor, chatbot)
- Middleware/proxy-style request handling for auth cookie continuity (`src/proxy.ts`)

## Data Model Highlights

- `notes`: TipTap content + AI summary fields
- `flashcards` / `decks`: generated/manual study cards + review tracking
- `note_embeddings`: vectorized note chunks for retrieval
- `chat_sessions` / `chat_messages`: personalized study conversations

---

## Environment Variables

Create `.env.local` with at least:

```bash
GEMINI_API_KEY=...
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Repository Notes

This documentation reflects the current implementation on `main` at the time of update. As AI features evolve (e.g., embedding refresh jobs, richer metadata, improved ranking), keep this README’s RAG section in sync with code paths under:

- `src/lib/embeddings.ts`
- `src/lib/rag-utils.ts`
- `src/app/api/chat/route.ts`
- `src/app/actions/ai.ts`
- `src/db/schema.ts`
