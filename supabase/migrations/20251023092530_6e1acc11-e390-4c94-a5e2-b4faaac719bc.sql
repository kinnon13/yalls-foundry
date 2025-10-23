-- Add ai_docs table for document scanning & RAG with Grok
CREATE TABLE IF NOT EXISTS ai_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'doc', 'docx', 'txt')),
  content TEXT,  -- Extracted/analyzed text from Grok
  embedding VECTOR(1536),  -- For RAG search
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  storage_path TEXT,  -- Path in Supabase storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS ai_docs_emb_idx ON ai_docs USING ivfflat (embedding vector_cosine_ops);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS ai_docs_user_idx ON ai_docs (user_id, analyzed_at DESC);

-- Enable RLS
ALTER TABLE ai_docs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own docs
CREATE POLICY "Users can view own docs" 
  ON ai_docs FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own docs" 
  ON ai_docs FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid() AND tenant_id = auth.uid());

CREATE POLICY "Users can update own docs" 
  ON ai_docs FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own docs" 
  ON ai_docs FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Service role has full access
CREATE POLICY "Service role full access" 
  ON ai_docs FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('docs', 'docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for docs bucket
CREATE POLICY "Users can upload own docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role has full storage access
CREATE POLICY "Service role full storage access"
  ON storage.objects FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');