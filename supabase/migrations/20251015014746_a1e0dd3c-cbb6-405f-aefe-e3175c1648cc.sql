-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for memory types
CREATE TYPE public.memory_type AS ENUM ('preference', 'fact', 'goal', 'note', 'policy', 'schema');

-- AI User Memory Table (per-user memories)
CREATE TABLE public.ai_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type memory_type NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL DEFAULT 'chat',
  embedding vector(1536),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(tenant_id, user_id, key)
);

-- AI Global Knowledge Table (admin/platform-wide knowledge)
CREATE TABLE public.ai_global_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  type memory_type NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.9 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL DEFAULT 'admin',
  embedding vector(1536),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, key)
);

-- Create indexes for performance
CREATE INDEX idx_ai_user_memory_user ON public.ai_user_memory(user_id);
CREATE INDEX idx_ai_user_memory_tenant ON public.ai_user_memory(tenant_id);
CREATE INDEX idx_ai_user_memory_tags ON public.ai_user_memory USING gin(tags);
CREATE INDEX idx_ai_user_memory_expires ON public.ai_user_memory(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_ai_user_memory_embedding ON public.ai_user_memory USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_ai_global_knowledge_tenant ON public.ai_global_knowledge(tenant_id);
CREATE INDEX idx_ai_global_knowledge_tags ON public.ai_global_knowledge USING gin(tags);
CREATE INDEX idx_ai_global_knowledge_expires ON public.ai_global_knowledge(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_ai_global_knowledge_embedding ON public.ai_global_knowledge USING ivfflat (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE public.ai_user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_global_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_user_memory
CREATE POLICY "Users can view their own memories"
  ON public.ai_user_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
  ON public.ai_user_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON public.ai_user_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON public.ai_user_memory FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memories"
  ON public.ai_user_memory FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_global_knowledge
CREATE POLICY "Everyone can view global knowledge"
  ON public.ai_global_knowledge FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage global knowledge"
  ON public.ai_global_knowledge FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to cleanup expired memories
CREATE OR REPLACE FUNCTION public.cleanup_expired_memories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_user_memory WHERE expires_at < now();
  DELETE FROM public.ai_global_knowledge WHERE expires_at < now();
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_memory_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ai_user_memory_timestamp
  BEFORE UPDATE ON public.ai_user_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_memory_timestamp();

CREATE TRIGGER update_ai_global_knowledge_timestamp
  BEFORE UPDATE ON public.ai_global_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_memory_timestamp();