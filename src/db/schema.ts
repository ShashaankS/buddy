import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, vector, index } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Folders for organizing notes
export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  parentId: uuid('parent_id'), // For nested folders
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Notes table
export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: jsonb('content'), // Stores TipTap JSON
  tags: text('tags').array(),
  isPinned: boolean('is_pinned').default(false),
  isArchived: boolean('is_archived').default(false),
  summary: text('summary'),
  keyPoints: text('key_points').array(),
  summaryWordCount: integer('summary_word_count'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Flashcards table
export const flashcards = pgTable('flashcards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  deckId: uuid('deck_id').references(() => decks.id, { onDelete: 'cascade' }),
  front: text('front').notNull(),
  back: text('back').notNull(),
  difficulty: text('difficulty').default('normal'), // easy, normal, hard
  nextReview: timestamp('next_review'),
  lastReviewed: timestamp('last_reviewed'),
  reviewCount: integer('review_count').default(0),
  isAiGenerated: boolean('is_ai_generated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// Flashcard decks
export const decks = pgTable('decks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Note embeddings for RAG
export const noteEmbeddings = pgTable('note_embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }), // Gemini embedding dimensions
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  embeddingIndex: index('embedding_index').using('hnsw', table.embedding.op('vector_cosine_ops')),
}))

// Chat sessions
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Chat messages
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => chatSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  contextNoteIds: uuid('context_note_ids').array(), // Notes used for context
  createdAt: timestamp('created_at').defaultNow(),
})

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  folders: many(folders),
  flashcards: many(flashcards),
  decks: many(decks),
  noteEmbeddings: many(noteEmbeddings),
  chatSessions: many(chatSessions),
  chatMessages: many(chatMessages),
}))

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [notes.folderId],
    references: [folders.id],
  }),
  flashcards: many(flashcards),
  embeddings: many(noteEmbeddings),
}))

export const noteEmbeddingsRelations = relations(noteEmbeddings, ({ one }) => ({
  note: one(notes, {
    fields: [noteEmbeddings.noteId],
    references: [notes.id],
  }),
  user: one(users, {
    fields: [noteEmbeddings.userId],
    references: [users.id],
  }),
}))

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}))
