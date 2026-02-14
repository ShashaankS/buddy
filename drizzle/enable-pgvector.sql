-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index for vector similarity search
-- This will be created automatically by Drizzle, but including here for reference
-- CREATE INDEX IF NOT EXISTS embedding_index ON note_embeddings 
-- USING hnsw (embedding vector_cosine_ops);
