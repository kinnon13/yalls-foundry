-- Phase 3: Complete Database Schema

-- 1. MARKETPLACE LISTINGS
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_cents INT NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 1,
  media JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold', 'archived')),
  location JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_listings_seller ON marketplace_listings(seller_profile_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_category ON marketplace_listings(category);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active listings" ON marketplace_listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can manage their listings" ON marketplace_listings
  FOR ALL USING (seller_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 2. SAVED ITEMS (for marketplace)
CREATE TABLE IF NOT EXISTS public.saved_items (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their saved items" ON saved_items
  FOR ALL USING (user_id = auth.uid());

-- 3. VIEWS (for tracking listing views)
CREATE TABLE IF NOT EXISTS public.views_coldstart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_views_listing ON views_coldstart(listing_id);

ALTER TABLE views_coldstart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record views" ON views_coldstart
  FOR INSERT WITH CHECK (true);

-- 4. STALLIONS (extends entities)
CREATE TABLE IF NOT EXISTS public.stallion_profiles (
  entity_id UUID PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  stud_fee_cents INT,
  breeding_status TEXT DEFAULT 'available' CHECK (breeding_status IN ('available', 'limited', 'retired')),
  offspring_count INT DEFAULT 0,
  genetics JSONB DEFAULT '{}'::jsonb,
  temperament_notes TEXT,
  breeding_record JSONB DEFAULT '{}'::jsonb,
  media JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stallion_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view stallion profiles" ON stallion_profiles
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage stallion profiles" ON stallion_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM entities e
      WHERE e.id = stallion_profiles.entity_id
      AND e.owner_user_id = auth.uid()
    )
  );

-- 5. BREEDING RECORDS
CREATE TABLE IF NOT EXISTS public.breeding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stallion_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  mare_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  breeding_date DATE NOT NULL,
  outcome TEXT CHECK (outcome IN ('pending', 'confirmed', 'foaled', 'failed')),
  foal_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_breeding_stallion ON breeding_records(stallion_entity_id);
CREATE INDEX idx_breeding_mare ON breeding_records(mare_entity_id);

ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Breeders can view their records" ON breeding_records
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Breeders can manage their records" ON breeding_records
  FOR ALL USING (created_by = auth.uid());

-- 6. FARM BOARDERS
CREATE TABLE IF NOT EXISTS public.boarders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  horse_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  board_type TEXT NOT NULL CHECK (board_type IN ('full', 'partial', 'pasture', 'training')),
  monthly_rate_cents INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  special_needs JSONB DEFAULT '{}'::jsonb,
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_boarders_business ON boarders(business_id);
CREATE INDEX idx_boarders_profile ON boarders(profile_id);

ALTER TABLE boarders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Boarders can view their records" ON boarders
  FOR SELECT USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farm staff can manage boarders" ON boarders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_team
      WHERE business_id = boarders.business_id
      AND user_id = auth.uid()
    )
  );

-- 7. DISCOVERY FEED ITEMS
CREATE TABLE IF NOT EXISTS public.discovery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('listing', 'event', 'stallion', 'post', 'entity')),
  item_id UUID NOT NULL,
  relevance_score REAL DEFAULT 0,
  trending_score REAL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_discovery_type ON discovery_items(item_type);
CREATE INDEX idx_discovery_trending ON discovery_items(trending_score DESC);

ALTER TABLE discovery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view discovery items" ON discovery_items
  FOR SELECT USING (expires_at IS NULL OR expires_at > now());

-- 8. LEADERBOARD
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('contributions', 'bounties_earned', 'entities_claimed', 'referrals', 'engagement')),
  metric_value INT NOT NULL DEFAULT 0,
  rank INT,
  period TEXT NOT NULL CHECK (period IN ('all_time', 'monthly', 'weekly')),
  period_start DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, metric_type, period, period_start)
);

CREATE INDEX idx_leaderboard_metric ON leaderboard_entries(metric_type, period, rank);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view leaderboard" ON leaderboard_entries
  FOR SELECT USING (true);

-- 9. BOUNTIES (for incentives)
CREATE TABLE IF NOT EXISTS public.bounty_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_cents INT NOT NULL,
  task_type TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  claimed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bounty_status ON bounty_tasks(status);

ALTER TABLE bounty_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active bounties" ON bounty_tasks
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can claim bounties" ON bounty_tasks
  FOR UPDATE USING (status = 'active');

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_stallion_profiles_updated_at
  BEFORE UPDATE ON stallion_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_breeding_records_updated_at
  BEFORE UPDATE ON breeding_records
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_boarders_updated_at
  BEFORE UPDATE ON boarders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_leaderboard_entries_updated_at
  BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();