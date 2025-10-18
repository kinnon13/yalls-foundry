# AI-First Platform Architecture Spec

> **Objective**: Transform the app into an AI-first, dynamic platform where Rocker (AI agent) can proactively adapt features, theming, and KPIs per user/workspace via policy-guarded APIs.

## Executive Summary

This spec defines a phased rollout to:
- Make areas, routes, and features config-driven
- Enable Rocker to reconfigure modules and themes dynamically
- Add live KPIs for all workspaces
- Establish EquineStats (public + private)
- Build Network & Affiliates (compliant MLM)
- Maintain backward compatibility via aliases

---

## Phase 1: Foundation & Config-Driven Architecture

### 1.1 Dynamic Area Discovery (Config-Driven)

**Goal**: Single source of truth for areas, routes, and capabilities that the scanner, UI, and Rocker all use.

**Deliverables**:
```typescript
// configs/area-discovery.json (canonical)
{
  "areas": [
    { "raw": "producer", "canonical": "dashboard", "subareas": ["workspace","entities","crm","listings","orders","programs","calendar","farm","messaging","growth"] },
    { "raw": "earnings", "canonical": "equinestats", "subareas": ["performance","programs","pedigree","comparisons","insights"] },
    { "raw": "composer", "canonical": "discovery", "subareas": ["feed"] },
    { "raw": "admin", "canonical": "admin", "subareas": ["audit","claims","features","control"] },
    { "raw": "ai", "canonical": "ai", "subareas": ["activity","memory","policy"] },
    { "raw": "discovery", "canonical": "discovery", "subareas": ["search","profiles","events","feed","marketplace"] },
    { "raw": "events", "canonical": "events", "subareas": ["producer_events","entrant"] },
    { "raw": "platform", "canonical": "platform", "subareas": ["auth","commerce","content","telemetry"] },
    { "raw": "profile", "canonical": "profile", "subareas": ["my_profile"] }
  ],
  "routeAliases": {
    "/organizer/*": "/workspace/:entityId/events/*",
    "/incentives/dashboard": "/workspace/:entityId/programs",
    "/dashboard": "/workspace",
    "/entrant": "/entries",
    "/equistats/*": "/equinestats/*"
  },
  "collapsedHeads": [
    "/events","/marketplace","/messages","/orders","/farm",
    "/entries","/entities","/listings","/profile","/stallions",
    "/cart","/workspace","/equinestats"
  ],
  "categories": {
    "/events": "public",
    "/marketplace": "public",
    "/entries": "private",
    "/workspace": "workspace",
    "/equinestats": "public"
  }
}
```

**Hooks to implement**:
```typescript
// src/hooks/useAreaDiscovery.ts
export function useAreaDiscovery() {
  return areaConfig;
}

export function useAreaForRoute(path: string): Area | null {
  // Resolve canonical area from path
}

export function useSubareaForRoute(path: string): string | null {
  // Resolve subarea from path
}
```

**Integration points**:
- Admin "Features" page: reads from config
- Feature scanner: uses config for grouping
- Router: uses aliases for redirects
- Navigation: uses collapsed heads for menu

**Acceptance criteria**:
- ✅ Changing config updates scanner UI without code changes
- ✅ All routes resolve to correct canonical area
- ✅ Aliases work correctly in router

---

## Phase 2: Rocker Control Plane (AI Reconfiguration)

### 2.1 Database Schema Extensions

**New tables**:

```sql
-- User segmentation (for targeting)
CREATE TABLE public.user_segments (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  segment TEXT NOT NULL, -- 'power_user', 'casual', 'producer_active', etc.
  weight REAL NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, segment)
);

-- Entity segmentation
CREATE TABLE public.entity_segments (
  entity_id UUID NOT NULL REFERENCES entities(id),
  segment TEXT NOT NULL, -- 'high_volume', 'seasonal', 'premium', etc.
  weight REAL NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_id, segment)
);

-- Theme overrides (per user or workspace)
CREATE TYPE theme_subject AS ENUM ('user', 'entity');

CREATE TABLE public.ui_theme_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type theme_subject NOT NULL,
  subject_id UUID NOT NULL,
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject_type, subject_id)
);

-- Capability gaps (what features entity should consider)
-- NOTE: This table already exists, ensure it's being used
-- CREATE TABLE IF NOT EXISTS public.capability_gaps (...);
```

**RLS policies**:
```sql
-- User segments: users can view their own, admins can view all
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_segments_self ON user_segments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_segments_admin ON user_segments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Entity segments: entity members can view, admins can manage
ALTER TABLE entity_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY entity_segments_members ON entity_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM entity_members 
      WHERE entity_id = entity_segments.entity_id 
      AND user_id = auth.uid()
    )
  );
CREATE POLICY entity_segments_admin ON entity_segments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Theme overrides: users can manage their own, entity owners can manage entity themes
ALTER TABLE ui_theme_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY theme_overrides_self ON ui_theme_overrides
  FOR ALL USING (
    (subject_type = 'user' AND subject_id = auth.uid())
    OR (subject_type = 'entity' AND EXISTS (
      SELECT 1 FROM entity_members 
      WHERE entity_id = subject_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );
```

### 2.2 Rocker Control RPCs

**Security-definer functions (policy-checked)**:

```sql
-- Recommend modules based on usage patterns & gaps
CREATE OR REPLACE FUNCTION recommend_workspace_modules(
  p_entity_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_suggestions JSONB;
BEGIN
  -- Check entity membership
  IF NOT EXISTS (
    SELECT 1 FROM entity_members 
    WHERE entity_id = p_entity_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Compute recommendations based on:
  -- 1. capability_gaps
  -- 2. usage_events
  -- 3. Similar entity patterns
  SELECT jsonb_agg(
    jsonb_build_object(
      'module', module,
      'reason', notes,
      'expected_lift', gap_score * 100
    )
  ) INTO v_suggestions
  FROM capability_gaps
  WHERE entity_id = p_entity_id
  AND gap_score > 0.3
  ORDER BY gap_score DESC
  LIMIT 5;

  RETURN COALESCE(v_suggestions, '[]'::jsonb);
END;
$$;

-- Accept a module recommendation (flip feature flags)
CREATE OR REPLACE FUNCTION accept_module_recommendation(
  p_entity_id UUID,
  p_module TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check entity membership
  IF NOT EXISTS (
    SELECT 1 FROM entity_members 
    WHERE entity_id = p_entity_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Enable feature flag or entitlement
  INSERT INTO entitlement_overrides (entity_id, feature_id, enabled)
  VALUES (p_entity_id, p_module, true)
  ON CONFLICT (entity_id, feature_id) 
  DO UPDATE SET enabled = true, updated_at = NOW();

  -- Log to ai_action_ledger
  INSERT INTO ai_action_ledger (user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'rocker',
    'accept_module_recommendation',
    jsonb_build_object('entity_id', p_entity_id, 'module', p_module),
    jsonb_build_object('enabled', true),
    'success'
  );
END;
$$;

-- Set theme overrides
CREATE OR REPLACE FUNCTION set_theme_overrides(
  p_subject_type theme_subject,
  p_subject_id UUID,
  p_tokens JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization check
  IF p_subject_type = 'user' AND p_subject_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only set own theme';
  END IF;

  IF p_subject_type = 'entity' AND NOT EXISTS (
    SELECT 1 FROM entity_members 
    WHERE entity_id = p_subject_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Upsert theme
  INSERT INTO ui_theme_overrides (subject_type, subject_id, tokens)
  VALUES (p_subject_type, p_subject_id, p_tokens)
  ON CONFLICT (subject_type, subject_id)
  DO UPDATE SET tokens = p_tokens, updated_at = NOW();

  -- Log
  INSERT INTO ai_action_ledger (user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'set_theme_overrides',
    jsonb_build_object('subject_type', p_subject_type, 'subject_id', p_subject_id),
    p_tokens,
    'success'
  );
END;
$$;

-- Get resolved theme (defaults → user → workspace)
CREATE OR REPLACE FUNCTION get_theme(
  p_subject_type theme_subject,
  p_subject_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_theme JSONB := '{
    "brand": {"primary":"#3B82F6","accent":"#10B981"},
    "surface": {"bg":"#0B0F14","card":"#131A22"},
    "text": {"primary":"#E5E7EB","muted":"#9CA3AF"},
    "density": {"scale": 0.0}
  }'::jsonb;
  v_override_theme JSONB;
BEGIN
  SELECT tokens INTO v_override_theme
  FROM ui_theme_overrides
  WHERE subject_type = p_subject_type
  AND subject_id = p_subject_id;

  -- Merge: base + overrides
  RETURN v_base_theme || COALESCE(v_override_theme, '{}'::jsonb);
END;
$$;
```

**Acceptance criteria**:
- ✅ Rocker can call `recommend_workspace_modules` → returns lift-scored suggestions
- ✅ Rocker can call `accept_module_recommendation` → flips flags; module appears without redeploy
- ✅ User says "I like purple" → calls `set_theme_overrides` → UI theme changes immediately
- ✅ All Rocker decisions logged to `ai_action_ledger`

---

## Phase 3: Theme System (Per-User/Workspace, AI-Tunable)

### 3.1 CSS Variables & Design Tokens

**File**: `theme/tokens.css` (base tokens)

```css
:root {
  /* Base theme tokens */
  --brand-primary: hsl(221, 83%, 53%);
  --brand-accent: hsl(142, 71%, 45%);
  
  --surface-bg: hsl(222, 47%, 11%);
  --surface-card: hsl(220, 27%, 18%);
  
  --text-primary: hsl(220, 9%, 90%);
  --text-muted: hsl(220, 9%, 61%);
  
  --density-scale: 1.0; /* 0.8 = compact, 1.0 = normal, 1.2 = comfortable */
}
```

### 3.2 Runtime Theme Resolver

**File**: `src/components/theme/ThemeBroker.tsx`

```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';

export function ThemeBroker() {
  const { session } = useSession();
  const { currentEntityId } = useWorkspaceContext();

  useEffect(() => {
    async function loadTheme() {
      if (!session?.userId) return;

      // Priority: workspace override → user override → default
      let theme: any = null;

      if (currentEntityId) {
        const { data } = await supabase
          .rpc('get_theme', {
            p_subject_type: 'entity',
            p_subject_id: currentEntityId
          });
        theme = data;
      }

      if (!theme || Object.keys(theme).length === 0) {
        const { data } = await supabase
          .rpc('get_theme', {
            p_subject_type: 'user',
            p_subject_id: session.userId
          });
        theme = data;
      }

      if (theme) {
        applyTheme(theme);
      }
    }

    loadTheme();
  }, [session?.userId, currentEntityId]);

  return null;
}

function applyTheme(tokens: any) {
  const root = document.documentElement;
  
  if (tokens.brand) {
    if (tokens.brand.primary) root.style.setProperty('--brand-primary', tokens.brand.primary);
    if (tokens.brand.accent) root.style.setProperty('--brand-accent', tokens.brand.accent);
  }
  
  if (tokens.surface) {
    if (tokens.surface.bg) root.style.setProperty('--surface-bg', tokens.surface.bg);
    if (tokens.surface.card) root.style.setProperty('--surface-card', tokens.surface.card);
  }
  
  if (tokens.text) {
    if (tokens.text.primary) root.style.setProperty('--text-primary', tokens.text.primary);
    if (tokens.text.muted) root.style.setProperty('--text-muted', tokens.text.muted);
  }
  
  if (tokens.density?.scale !== undefined) {
    root.style.setProperty('--density-scale', tokens.density.scale.toString());
  }
}
```

**Integration**: Add `<ThemeBroker />` to app root in `App.tsx`

**Acceptance criteria**:
- ✅ Theme loads from workspace → user → default priority
- ✅ Theme changes apply immediately without page reload
- ✅ CSS variables update correctly across components

---

## Phase 4: KPI Spine (Live Tiles for Every Business)

### 4.1 Streaming KPI Updates

**Goal**: All workspaces get live KPIs + historical snapshots.

**Data sources**:
- `usage_events` (views, clicks, dwells)
- `orders` (GMV, conversions)
- `entries` (registrations)
- `business_kpi_snapshots` (historical)

### 4.2 KPI RPCs

```sql
-- Get workspace KPIs (cached 60-120s)
CREATE OR REPLACE FUNCTION get_workspace_kpis(
  p_entity_id UUID,
  p_horizon TEXT DEFAULT '7d'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_range TSTZRANGE;
  v_kpis JSONB;
BEGIN
  -- Authorization
  IF NOT EXISTS (
    SELECT 1 FROM entity_members 
    WHERE entity_id = p_entity_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_range := tstzrange(
    NOW() - (p_horizon || ' days')::INTERVAL,
    NOW()
  );

  SELECT jsonb_build_object(
    'revenue_cents', COALESCE(SUM(total_cents), 0),
    'orders', COUNT(DISTINCT o.id),
    'entries', COUNT(DISTINCT e.id),
    'views', COUNT(DISTINCT ue.id)
  ) INTO v_kpis
  FROM orders o
  LEFT JOIN entries e ON e.created_at <@ v_range
  LEFT JOIN usage_events ue ON ue.created_at <@ v_range
  WHERE o.created_at <@ v_range;

  RETURN v_kpis;
END;
$$;

-- Producer event funnels
CREATE OR REPLACE FUNCTION get_producer_funnels(
  p_entity_id UUID,
  p_date_range TSTZRANGE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization check...
  
  -- Return funnel metrics: views → clicks → registrations → checkups
  RETURN jsonb_build_object(
    'views', 0,
    'clicks', 0,
    'registrations', 0,
    'checkins', 0
  );
END;
$$;

-- Listing sales KPIs
CREATE OR REPLACE FUNCTION get_listing_sales_kpis(
  p_entity_id UUID,
  p_date_range TSTZRANGE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Views → ATC → Purchase funnel
  RETURN jsonb_build_object(
    'views', 0,
    'add_to_cart', 0,
    'purchases', 0,
    'gmv_cents', 0
  );
END;
$$;

-- Incentive tiers KPIs
CREATE OR REPLACE FUNCTION get_incentive_tiers_kpis(
  p_entity_id UUID,
  p_program_id UUID,
  p_date_range TSTZRANGE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nominations, entries, payouts by tier
  RETURN jsonb_build_object(
    'nominations', 0,
    'entries', 0,
    'payouts_cents', 0
  );
END;
$$;

-- Farm ops KPIs
CREATE OR REPLACE FUNCTION get_farm_ops_kpis(
  p_entity_id UUID,
  p_date_range TSTZRANGE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Boarders, revenue, occupancy
  RETURN jsonb_build_object(
    'boarders', 0,
    'revenue_cents', 0,
    'occupancy_pct', 0
  );
END;
$$;
```

### 4.3 KPI Dashboard UI

**Component**: `src/components/dashboard/KpiTiles.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';

export function KpiTiles() {
  const { currentEntityId } = useWorkspaceContext();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['workspace-kpis', currentEntityId],
    queryFn: async () => {
      if (!currentEntityId) return null;
      const { data } = await supabase.rpc('get_workspace_kpis', {
        p_entity_id: currentEntityId,
        p_horizon: '7d'
      });
      return data;
    },
    enabled: !!currentEntityId,
    staleTime: 60 * 1000, // Cache for 60s
    refetchInterval: 120 * 1000 // Refetch every 2 min
  });

  if (isLoading) return <div>Loading KPIs...</div>;
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      <KpiTile label="Revenue" value={`$${(kpis.revenue_cents / 100).toFixed(2)}`} />
      <KpiTile label="Orders" value={kpis.orders} />
      <KpiTile label="Entries" value={kpis.entries} />
      <KpiTile label="Views" value={kpis.views} />
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4 rounded-lg bg-surface-card">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
```

**Acceptance criteria**:
- ✅ Every workspace shows KPI tiles within <2 min of underlying data changes
- ✅ KPIs update automatically via polling (2min interval)
- ✅ Historical snapshots available via `business_kpi_snapshots`

---

## Phase 5: EquineStats (Public + Private)

### 5.1 Route Structure

**Public routes**: `/equinestats/*`
- `/equinestats/horse/:id` - horse performance
- `/equinestats/compare` - compare horses
- `/equinestats/pedigree/:id` - pedigree tree
- `/equinestats/crosses/:sireId/:damId` - cross analysis
- `/equinestats/insights` - market insights

**Private route**: `/workspace/:entityId/equinestats`
- Owner-only earnings, tiered payouts sim

### 5.2 EquineStats RPCs

Already created in previous migration:
- `payout_compute(horse_entity_id, date_range)`
- `equinestats_public_overview(subject_id, scope)`
- `equinestats_live_kpis(entity_id, window_hours)`

**Acceptance criteria**:
- ✅ Public pages render without auth
- ✅ Owners see private analytics at `/workspace/:entityId/equinestats`
- ✅ Link from public to private when user has access

---

## Phase 6: Network & Affiliates (Growth Module)

### 6.1 Database Schema

```sql
-- Referral links
CREATE TABLE public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  code TEXT NOT NULL UNIQUE,
  landing TEXT NOT NULL, -- URL path
  terms_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referral events (tracking)
CREATE TABLE public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES referral_links(id),
  user_id UUID REFERENCES auth.users(id),
  event TEXT NOT NULL, -- 'click', 'signup', 'purchase'
  order_id UUID REFERENCES orders(id),
  amount_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Referral tree (MLM structure)
CREATE TABLE public.referral_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_entity_id UUID NOT NULL REFERENCES entities(id),
  child_entity_id UUID NOT NULL REFERENCES entities(id),
  level INT NOT NULL, -- 1 = direct, 2 = second-tier, etc.
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_entity_id, child_entity_id)
);

-- Referral commissions
CREATE TABLE public.referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id),
  source_id UUID NOT NULL, -- order_id or event_id
  basis TEXT NOT NULL, -- 'direct_sale', 'tier2_sale', etc.
  rate NUMERIC NOT NULL, -- Commission rate (0.10 = 10%)
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'clawed_back'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS policies**:
```sql
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_links_owner ON referral_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM entity_members 
      WHERE entity_id = owner_entity_id 
      AND user_id = auth.uid()
    )
  );

ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_events_owner ON referral_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referral_links rl
      JOIN entity_members em ON em.entity_id = rl.owner_entity_id
      WHERE rl.id = referral_events.link_id
      AND em.user_id = auth.uid()
    )
  );

ALTER TABLE referral_tree ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_tree_member ON referral_tree
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM entity_members 
      WHERE entity_id IN (parent_entity_id, child_entity_id)
      AND user_id = auth.uid()
    )
  );

ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_commissions_owner ON referral_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM entity_members 
      WHERE entity_id = referral_commissions.entity_id
      AND user_id = auth.uid()
    )
  );
```

### 6.2 Growth RPCs

```sql
-- Create referral link
CREATE OR REPLACE FUNCTION create_referral_link(
  p_entity_id UUID,
  p_landing TEXT,
  p_code TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_link_id UUID;
BEGIN
  -- Authorization
  IF NOT EXISTS (
    SELECT 1 FROM entity_members 
    WHERE entity_id = p_entity_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_code := COALESCE(p_code, lower(substring(md5(random()::text) from 1 for 8)));

  INSERT INTO referral_links (owner_entity_id, code, landing)
  VALUES (p_entity_id, v_code, p_landing)
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;

-- Get referral dashboard
CREATE OR REPLACE FUNCTION get_referral_dashboard(
  p_entity_id UUID,
  p_date_range TSTZRANGE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  -- Authorization
  IF NOT EXISTS (
    SELECT 1 FROM entity_members 
    WHERE entity_id = p_entity_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'referred_gmv_cents', COALESCE(SUM(re.amount_cents), 0),
    'net_commissions_cents', COALESCE(SUM(rc.amount_cents), 0),
    'top_partners', '[]'::jsonb,
    'downline_health', 0.0
  ) INTO v_stats
  FROM referral_events re
  LEFT JOIN referral_links rl ON rl.id = re.link_id
  LEFT JOIN referral_commissions rc ON rc.entity_id = p_entity_id
  WHERE rl.owner_entity_id = p_entity_id
  AND re.created_at <@ p_date_range;

  RETURN v_stats;
END;
$$;

-- Calculate commissions
CREATE OR REPLACE FUNCTION calculate_referral_commissions(
  p_entity_id UUID,
  p_date_range TSTZRANGE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization...
  
  -- Calculate commissions based on referral events
  -- Apply caps, clawbacks on returns
  -- Update referral_commissions table
  
  RAISE NOTICE 'Commissions calculated for entity %', p_entity_id;
END;
$$;
```

### 6.3 Growth UI

**Route**: `/workspace/:entityId/growth`

**Component**: `src/components/growth/GrowthDashboard.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';

export function GrowthDashboard() {
  const { currentEntityId } = useWorkspaceContext();

  const { data: stats } = useQuery({
    queryKey: ['referral-dashboard', currentEntityId],
    queryFn: async () => {
      if (!currentEntityId) return null;
      const { data } = await supabase.rpc('get_referral_dashboard', {
        p_entity_id: currentEntityId,
        p_date_range: '[2024-01-01,2025-01-01)'
      });
      return data;
    },
    enabled: !!currentEntityId
  });

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2>Network & Affiliates</h2>
      <div className="grid grid-cols-3 gap-4">
        <KpiTile label="Referred GMV" value={`$${(stats.referred_gmv_cents / 100).toFixed(2)}`} />
        <KpiTile label="Net Commissions" value={`$${(stats.net_commissions_cents / 100).toFixed(2)}`} />
        <KpiTile label="Downline Health" value={`${(stats.downline_health * 100).toFixed(1)}%`} />
      </div>
    </div>
  );
}
```

**Acceptance criteria**:
- ✅ Growth module shows referral KPIs
- ✅ Commissions compute with return clawbacks
- ✅ Compliance caps enforced

---

## Phase 7: Producer/Entrant Consolidation

### 7.1 Route Redirects

**Legacy routes**:
- `/organizer/*` → `/workspace/:entityId/events/*`

**Implementation**: Already handled in `src/lib/navigation/redirects.ts`

**Canonical producer routes**:
- `/workspace/:entityId/events` - event list
- `/workspace/:entityId/events/:id/manage` - event dashboard
- `/workspace/:entityId/events/:id/check-in` - QR check-in

**Acceptance criteria**:
- ✅ `/organizer/*` routes redirect correctly
- ✅ State preserved during redirect

---

## Phase 8: AI Loops & NBA (Next-Best-Actions)

### 8.1 NBA Generation

**Data sources**:
- `ai_user_analytics` (user behavior)
- `usage_events` (engagement)
- `rpc_observations` (feature usage)
- `business_kpi_snapshots` (trends)

### 8.2 NBA Component

**Component**: `src/components/dashboard/NBATray.tsx`

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';

interface NBA {
  id: string;
  title: string;
  reason: string;
  action: string;
  payload: any;
}

export function NBATray() {
  const { currentEntityId } = useWorkspaceContext();

  const { data: actions } = useQuery<NBA[]>({
    queryKey: ['nba', currentEntityId],
    queryFn: async () => {
      if (!currentEntityId) return [];
      const { data } = await supabase.rpc('rocker_next_best_actions', {
        p_entity_id: currentEntityId,
        p_limit: 5
      });
      return data || [];
    },
    enabled: !!currentEntityId
  });

  const acceptMutation = useMutation({
    mutationFn: async (action: NBA) => {
      // Execute action based on type
      if (action.action === 'enable_module') {
        await supabase.rpc('accept_module_recommendation', {
          p_entity_id: currentEntityId,
          p_module: action.payload.module
        });
      }
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (action: NBA) => {
      await supabase.from('ai_feedback').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: action.action,
        success: false,
        payload: action.payload,
        message: 'Dismissed'
      });
    }
  });

  if (!actions || actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3>Next Best Actions</h3>
      {actions.map((action) => (
        <div key={action.id} className="p-4 rounded-lg bg-surface-card">
          <div className="font-semibold">{action.title}</div>
          <div className="text-sm text-muted">{action.reason}</div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => acceptMutation.mutate(action)}>Accept</button>
            <button onClick={() => dismissMutation.mutate(action)}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Acceptance criteria**:
- ✅ NBA tray surfaces at least 5 actionable cards with reason codes
- ✅ User can accept/decline
- ✅ Declines feed `ai_feedback`

---

## Phase 9: Marketplace + Listings from Dashboard

### 9.1 Seller Listing Management

**Routes** (already implemented):
- `/workspace/:entityId/listings` - index
- `/workspace/:entityId/listings/new` - create wizard
- `/workspace/:entityId/listings/:id/edit` - editor

**RPCs** (already implemented):
- `listing_upsert(entity_id, payload)`
- `listing_publish(listing_id, is_active)`
- `get_price_suggestions(listing_id)`

**Acceptance criteria**:
- ✅ Seller can create/manage listings from workspace
- ✅ Listings appear in marketplace when published
- ✅ Funnel KPIs: views → ATC → Purchase tracked

---

## Phase 10: Privacy, Consent, and Policy

### 10.1 Consent Enforcement

**Tables** (already exist):
- `ai_consent`
- `ai_user_consent`
- `ai_user_privacy`
- `ai_policy_rules`
- `ai_blocklist`

**Enforcement points**:
- All Rocker actions must check `rocker_check_consent(user_id, action_type)`
- Block actions based on `ai_policy_rules`
- Check `ai_blocklist` for forbidden patterns

**Acceptance criteria**:
- ✅ All AI actions are consent-aware
- ✅ Policy rules enforced before execution
- ✅ Audit trail in `ai_action_ledger`

---

## Phase 11: Instrumentation & Explainability

### 11.1 Observability

**Tables** (already exist):
- `rpc_observations`
- `usage_events`
- `idempotency_keys`
- `rate_limit_counters`

### 11.2 Explainability UI

**Component**: `src/components/shared/WhyThis.tsx`

```typescript
export function WhyThis({ reason }: { reason: string }) {
  return (
    <div className="text-xs text-muted cursor-help" title={reason}>
      Why this?
    </div>
  );
}
```

**Usage**: Add to NBA cards, recommendations, rankings

**Acceptance criteria**:
- ✅ Reason codes exposed in UI
- ✅ `WhyThis` component available inline

---

## Phase 12: Guardrails & RLS

### 12.1 Security Principles

- All new tables are workspace-scoped
- RLS policy = owner OR entity_members
- Public EquineStats uses aggregate/anonymized reads only
- Never store roles on profile or users table

**Acceptance criteria**:
- ✅ All tables have RLS enabled
- ✅ Public data appropriately anonymized
- ✅ Roles stored in separate `user_roles` table

---

## Migration Checklist

### Database Migrations

- [ ] Phase 2: Create `user_segments`, `entity_segments`, `ui_theme_overrides` tables
- [ ] Phase 2: Create Rocker control RPCs
- [ ] Phase 4: Create KPI RPCs
- [ ] Phase 6: Create Growth tables and RPCs
- [ ] Backfill `business_kpi_snapshots` for 90 days

### Code Changes

- [ ] Phase 1: Create `configs/area-discovery.json`
- [ ] Phase 1: Create `useAreaDiscovery` hooks
- [ ] Phase 2: Create Rocker control client functions
- [ ] Phase 3: Create `ThemeBroker` component
- [ ] Phase 3: Create `theme/tokens.css`
- [ ] Phase 4: Create `KpiTiles` component
- [ ] Phase 5: Update EquineStats routes
- [ ] Phase 6: Create `GrowthDashboard` component
- [ ] Phase 8: Create `NBATray` component
- [ ] Phase 11: Create `WhyThis` component

### Configuration

- [ ] Phase 1: Seed `configs/area-discovery.json`
- [ ] Phase 3: Add `ThemeBroker` to app root
- [ ] Phase 4: Add KPI polling to dashboard
- [ ] Phase 6: Add Growth nav item
- [ ] Phase 7: Update route redirects
- [ ] Toggle feature flags for early testers:
  - [ ] `workspace_growth`
  - [ ] `nba_tray`
  - [ ] `equinestats_private`
  - [ ] `theme_overrides`

---

## Rollout Strategy

1. **Week 1-2**: Phase 1 (Config-driven architecture)
2. **Week 3-4**: Phase 2 (Rocker control plane)
3. **Week 5**: Phase 3 (Theme system)
4. **Week 6-7**: Phase 4 (KPI spine)
5. **Week 8**: Phase 5 (EquineStats)
6. **Week 9-10**: Phase 6 (Growth module)
7. **Week 11**: Phases 7-11 (Consolidation, NBA, instrumentation)
8. **Week 12**: Testing, bug fixes, documentation

---

## Success Metrics

- ✅ Changing `area-discovery.json` updates UI without code deploy
- ✅ Rocker can enable modules dynamically
- ✅ Theme changes apply instantly
- ✅ All workspaces show live KPIs
- ✅ EquineStats public + private working
- ✅ Growth module tracking referrals correctly
- ✅ NBA tray showing relevant actions
- ✅ All security guardrails in place

---

## Open Questions

1. **KPI refresh rate**: 2min polling vs realtime subscriptions?
2. **Growth commission caps**: What are the legal limits per jurisdiction?
3. **Theme overrides**: Should admins be able to force themes globally?
4. **NBA priority**: How to rank competing recommendations?

---

## Appendices

### A. Route Migration Matrix

| Legacy | Canonical | Status |
|--------|-----------|--------|
| `/organizer/*` | `/workspace/:entityId/events/*` | ✅ Redirected |
| `/incentives/dashboard` | `/workspace/:entityId/programs` | ✅ Redirected |
| `/equistats/*` | `/equinestats/*` | ✅ Redirected |
| `/entrant` | `/entries` | ✅ Redirected |
| `/dashboard` | `/workspace` | ✅ Redirected |

### B. Table Ownership Matrix

| Table | Owner | RLS Policy |
|-------|-------|------------|
| `user_segments` | User | Self + Admin |
| `entity_segments` | Entity | Members + Admin |
| `ui_theme_overrides` | User/Entity | Self/Owner + Admin |
| `referral_links` | Entity | Members |
| `referral_commissions` | Entity | Members |
| `business_kpi_snapshots` | Entity | Members |

### C. RPC Security Matrix

| RPC | Security Definer | Authorization Check |
|-----|------------------|---------------------|
| `recommend_workspace_modules` | Yes | Entity membership |
| `accept_module_recommendation` | Yes | Entity owner/admin |
| `set_theme_overrides` | Yes | Self or entity owner |
| `get_workspace_kpis` | Yes | Entity membership |
| `create_referral_link` | Yes | Entity membership |
| `get_referral_dashboard` | Yes | Entity membership |
