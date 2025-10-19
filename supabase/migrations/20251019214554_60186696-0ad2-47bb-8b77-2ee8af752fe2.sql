-- Part 1: Create tables only (no functions that might fail)

-- 1) Marketplace Categories
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  category text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_domain ON public.marketplace_categories(domain);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_slug ON public.marketplace_categories(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_category ON public.marketplace_categories(category);

-- 2) Interest → Category Mapping
CREATE TABLE IF NOT EXISTS public.marketplace_interest_map (
  interest_id uuid NOT NULL REFERENCES public.interest_catalog(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.marketplace_categories(id) ON DELETE CASCADE,
  confidence numeric(3,2) NOT NULL DEFAULT 0.90 CHECK (confidence >= 0.00 AND confidence <= 1.00),
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (interest_id, category_id)
);

-- 3) Discovery Queue
CREATE TABLE IF NOT EXISTS public.marketplace_discovery_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id uuid NOT NULL REFERENCES public.interest_catalog(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','done','error')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_queue_status ON public.marketplace_discovery_queue(status, created_at);

-- 4) Marketplace Candidates
CREATE TABLE IF NOT EXISTS public.marketplace_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id uuid NOT NULL REFERENCES public.interest_catalog(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  source text NOT NULL,
  title text NOT NULL,
  url text,
  price_cents int,
  currency text DEFAULT 'USD',
  image_url text,
  metadata jsonb NOT NULL DEFAULT '{}',
  score numeric(4,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_interest ON public.marketplace_candidates(interest_id);
CREATE INDEX IF NOT EXISTS idx_candidates_category ON public.marketplace_candidates(category_id);

-- 5) Marketplace Gaps
CREATE TABLE IF NOT EXISTS public.marketplace_gaps (
  interest_id uuid PRIMARY KEY REFERENCES public.interest_catalog(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.marketplace_categories(id),
  inventory_ct int NOT NULL DEFAULT 0,
  gap_level text NOT NULL DEFAULT 'none' CHECK (gap_level IN ('none','low','critical')),
  last_checked timestamptz NOT NULL DEFAULT now()
);

-- 6) Intent Signals
CREATE TABLE IF NOT EXISTS public.intent_signals (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_kind text,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intent_signals_user_ts ON public.intent_signals(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_intent_signals_name ON public.intent_signals(name);

-- RLS Policies
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_interest_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_discovery_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intent_signals ENABLE ROW LEVEL SECURITY;

-- Basic read policies
CREATE POLICY "categories_public_read" ON public.marketplace_categories FOR SELECT USING (true);
CREATE POLICY "interest_map_public_read" ON public.marketplace_interest_map FOR SELECT USING (true);
CREATE POLICY "candidates_public_read" ON public.marketplace_candidates FOR SELECT USING (true);
CREATE POLICY "gaps_public_read" ON public.marketplace_gaps FOR SELECT USING (true);

-- Admin policy for discovery queue
CREATE POLICY "discovery_admin_all" ON public.marketplace_discovery_queue FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- User-specific policies for signals
CREATE POLICY "signals_insert_self" ON public.intent_signals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "signals_read_self" ON public.intent_signals FOR SELECT USING (user_id = auth.uid());