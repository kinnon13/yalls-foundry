-- Vector similarity search function for knowledge chunks
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  item_id UUID,
  idx INT,
  text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.item_id,
    knowledge_chunks.idx,
    knowledge_chunks.text,
    1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE knowledge_chunks.embedding IS NOT NULL
    AND 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Vector similarity search function for knowledge items
CREATE OR REPLACE FUNCTION match_knowledge_items(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.6,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  uri TEXT,
  scope TEXT,
  category TEXT,
  subcategory TEXT,
  title TEXT,
  summary TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_items.id,
    knowledge_items.uri,
    knowledge_items.scope,
    knowledge_items.category,
    knowledge_items.subcategory,
    knowledge_items.title,
    knowledge_items.summary,
    knowledge_items.tags,
    1 - (knowledge_items.embedding <=> query_embedding) AS similarity
  FROM knowledge_items
  WHERE knowledge_items.embedding IS NOT NULL
    AND 1 - (knowledge_items.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;