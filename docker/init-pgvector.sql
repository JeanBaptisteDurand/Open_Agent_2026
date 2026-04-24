-- Enable the pgvector extension used for RAG embeddings (pool regime notes,
-- hook documentation corpus, etc). Runs once on fresh database init.
CREATE EXTENSION IF NOT EXISTS vector;
