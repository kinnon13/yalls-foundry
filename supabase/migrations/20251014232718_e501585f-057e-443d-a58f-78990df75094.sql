-- Phase 1: Polymorphic entity_profiles (1B-ready with partitioning + HNSW)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Entity type enum (discriminator)
CREATE TYPE public.entity_type AS ENUM (
  'profile',
  'horse',
  'business',
  'breeder',
  'owner',
  'rider',
  'stable',
  'event'
);

-- Create partitioned entity_profiles table
CREATE TABLE public.entity_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_type public.entity_type NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_claimed boolean NOT NULL DEFAULT false,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  embedding vector(1536), -- OpenAI ada-002 dimensions for future semantic search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions (monthly for 1B rows: ~80M/month = 2.6M/day avg)
-- Jan 2025
CREATE TABLE public.entity_profiles_2025_01 PARTITION OF public.entity_profiles
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- Feb 2025
CREATE TABLE public.entity_profiles_2025_02 PARTITION OF public.entity_profiles
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- Mar 2025
CREATE TABLE public.entity_profiles_2025_03 PARTITION OF public.entity_profiles
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Indexes for performance (p95 <400ms target)
CREATE INDEX idx_entity_profiles_slug ON public.entity_profiles USING btree (slug);
CREATE INDEX idx_entity_profiles_type_owner ON public.entity_profiles USING btree (entity_type, owner_id, created_at DESC);
CREATE INDEX idx_entity_profiles_claimed ON public.entity_profiles USING btree (claimed_by, created_at DESC) WHERE claimed_by IS NOT NULL;
CREATE INDEX idx_entity_profiles_search ON public.entity_profiles USING gin (search_vector);
CREATE INDEX idx_entity_profiles_custom ON public.entity_profiles USING gin (custom_fields);

-- HNSW vector index (m=16, ef_construction=64 for 1B scale per pgvector docs)
CREATE INDEX idx_entity_profiles_embedding ON public.entity_profiles 
  USING hnsw (embedding vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

-- Composite tenant sharding hint (business apps pattern)
CREATE INDEX idx_entity_profiles_tenant_time ON public.entity_profiles 
  USING btree (owner_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.entity_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Entities are viewable by everyone"
  ON public.entity_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert their entities"
  ON public.entity_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their entities"
  ON public.entity_profiles
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their entities"
  ON public.entity_profiles
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Claim RPC (security definer to bypass RLS for claim check)
CREATE OR REPLACE FUNCTION public.can_claim_entity(entity_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if entity exists and is unclaimed
  RETURN EXISTS (
    SELECT 1 
    FROM public.entity_profiles 
    WHERE id = entity_id 
      AND is_claimed = false
      AND claimed_by IS NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_entity(entity_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Attempt claim (atomic upsert)
  UPDATE public.entity_profiles
  SET claimed_by = auth.uid(),
      is_claimed = true,
      updated_at = now()
  WHERE id = entity_id
    AND is_claimed = false
    AND claimed_by IS NULL
  RETURNING jsonb_build_object(
    'success', true,
    'id', id,
    'claimed_by', claimed_by,
    'claimed_at', updated_at
  ) INTO v_result;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'entity_already_claimed',
      'message', 'This entity has already been claimed.'
    );
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_claim_entity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_entity(uuid) TO authenticated;

-- Updated_at trigger
CREATE TRIGGER update_entity_profiles_updated_at
  BEFORE UPDATE ON public.entity_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_profiles;

-- Comments
COMMENT ON TABLE public.entity_profiles IS 'Polymorphic entity system: profiles, horses, businesses, etc. Partitioned by created_at for 1B+ rows.';
COMMENT ON COLUMN public.entity_profiles.entity_type IS 'Discriminator for polymorphic unions (profile|horse|business|...)';
COMMENT ON COLUMN public.entity_profiles.custom_fields IS 'JSONB store for entity-specific fields (validated via Zod in application)';
COMMENT ON COLUMN public.entity_profiles.embedding IS 'Vector embedding (1536d) for semantic search via HNSW index';
COMMENT ON FUNCTION public.claim_entity IS 'Atomic claim operation: sets claimed_by + is_claimed, broadcasts via realtime';