-- Immutable Financial Ledgers
-- These tables use append-only patterns with DB-level protection

-- Commission Ledger: Track all payouts and earnings
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'referral', 'tier_bonus', 'reversal')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  source_entity_type TEXT,
  source_entity_id UUID,
  settlement_batch_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'reversed')),
  -- Immutability: never allow updates/deletes
  CONSTRAINT immutable_check CHECK (created_at IS NOT NULL)
);

-- Block updates and deletes at DB level
CREATE RULE block_commission_updates AS ON UPDATE TO public.commission_ledger DO INSTEAD NOTHING;
CREATE RULE block_commission_deletes AS ON DELETE TO public.commission_ledger DO INSTEAD NOTHING;

-- Settlement Batches: Group payouts for processing
CREATE TABLE IF NOT EXISTS public.settlement_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  batch_date DATE NOT NULL,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processor_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE RULE block_settlement_updates AS ON UPDATE TO public.settlement_batches DO INSTEAD NOTHING;
CREATE RULE block_settlement_deletes AS ON DELETE TO public.settlement_batches DO INSTEAD NOTHING;

-- Claim Events: Append-only log of all claim actions
CREATE TABLE IF NOT EXISTS public.claim_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL CHECK (event_type IN ('claim', 'unclaim', 'transfer', 'dispute')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  new_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ
);

CREATE RULE block_claim_updates AS ON UPDATE TO public.claim_events DO INSTEAD NOTHING;
CREATE RULE block_claim_deletes AS ON DELETE TO public.claim_events DO INSTEAD NOTHING;

-- Affiliate Subscriptions: Track MLM relationships immutably
CREATE TABLE IF NOT EXISTS public.affiliate_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('direct', 'tier2', 'tier3')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  terminated_at TIMESTAMPTZ,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE RULE block_affiliate_updates AS ON UPDATE TO public.affiliate_subscriptions DO INSTEAD NOTHING;
CREATE RULE block_affiliate_deletes AS ON DELETE TO public.affiliate_subscriptions DO INSTEAD NOTHING;

-- Indexes for performance
CREATE INDEX idx_commission_user ON public.commission_ledger(user_id, created_at DESC);
CREATE INDEX idx_commission_batch ON public.commission_ledger(settlement_batch_id);
CREATE INDEX idx_commission_source ON public.commission_ledger(source_entity_type, source_entity_id);
CREATE INDEX idx_settlement_status ON public.settlement_batches(status, batch_date);
CREATE INDEX idx_claim_entity ON public.claim_events(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_claim_actor ON public.claim_events(actor_user_id, created_at DESC);
CREATE INDEX idx_affiliate_referrer ON public.affiliate_subscriptions(referrer_user_id, status);
CREATE INDEX idx_affiliate_referred ON public.affiliate_subscriptions(referred_user_id, status);

-- RLS Policies
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own commission history
CREATE POLICY "Users view own commissions"
ON public.commission_ledger FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all commissions
CREATE POLICY "Admins view all commissions"
ON public.commission_ledger FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

-- Users can insert commissions (via app logic)
CREATE POLICY "System can insert commissions"
ON public.commission_ledger FOR INSERT
TO authenticated
WITH CHECK (true);

-- Settlement batches: admins only
CREATE POLICY "Admins manage settlements"
ON public.settlement_batches FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- Claim events: users can view their own
CREATE POLICY "Users view own claim events"
ON public.claim_events FOR SELECT
TO authenticated
USING (auth.uid() IN (actor_user_id, previous_owner_id, new_owner_id));

-- Admins can view all claim events
CREATE POLICY "Admins view all claims"
ON public.claim_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

-- System can insert claim events
CREATE POLICY "System can insert claim events"
ON public.claim_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- Affiliate subscriptions: users can view their network
CREATE POLICY "Users view own affiliate network"
ON public.affiliate_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() IN (referrer_user_id, referred_user_id));

-- Admins can view all affiliates
CREATE POLICY "Admins view all affiliates"
ON public.affiliate_subscriptions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

-- System can insert affiliates
CREATE POLICY "System can insert affiliates"
ON public.affiliate_subscriptions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add HNSW indexes for vector search (Rocker performance)
CREATE INDEX IF NOT EXISTS idx_ai_um_hnsw 
ON public.ai_user_memory 
USING hnsw (embedding vector_cosine_ops) 
WITH (m=16, ef_construction=64);

CREATE INDEX IF NOT EXISTS idx_ai_gk_hnsw 
ON public.ai_global_knowledge 
USING hnsw (embedding vector_cosine_ops) 
WITH (m=16, ef_construction=64);