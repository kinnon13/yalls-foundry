-- Public App Pack Tables

-- Table: public_app_visibility
-- Controls which apps are visible on each entity's public profile
CREATE TABLE IF NOT EXISTS public.public_app_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  app_id TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, app_id)
);

-- Table: connection_edges
-- Tracks follow/favorite relationships between users and entities
CREATE TABLE IF NOT EXISTS public.connection_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('follow', 'favorite')),
  scope JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "apps": ["calendar", "events"] }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_id, edge_type)
);

-- Table: subscriptions
-- Tracks notification preferences for entity modules
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  app_id TEXT NOT NULL,
  prefs JSONB NOT NULL DEFAULT '{"enabled": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_id, app_id)
);

-- Table: public_counters
-- Aggregates for profile stats
CREATE TABLE IF NOT EXISTS public.public_counters (
  entity_id UUID PRIMARY KEY,
  likes_count INTEGER NOT NULL DEFAULT 0,
  favorites_count INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_app_visibility_entity ON public.public_app_visibility(entity_id);
CREATE INDEX IF NOT EXISTS idx_connection_edges_user ON public.connection_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_edges_entity ON public.connection_edges(entity_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_entity_app ON public.subscriptions(entity_id, app_id);

-- RLS Policies

-- public_app_visibility: Everyone can view, owners can manage
ALTER TABLE public.public_app_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_app_visibility_select_all" ON public.public_app_visibility
  FOR SELECT USING (true);

CREATE POLICY "public_app_visibility_owner_manage" ON public.public_app_visibility
  FOR ALL USING (
    entity_id IN (
      SELECT id FROM entities WHERE owner_user_id = auth.uid()
    )
  );

-- connection_edges: Users manage their own connections
ALTER TABLE public.connection_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connection_edges_owner_rw" ON public.connection_edges
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "connection_edges_public_read" ON public.connection_edges
  FOR SELECT USING (true);

-- subscriptions: Users manage their own subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_owner_rw" ON public.subscriptions
  FOR ALL USING (user_id = auth.uid());

-- public_counters: Everyone can read, system updates
ALTER TABLE public.public_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_counters_select_all" ON public.public_counters
  FOR SELECT USING (true);

CREATE POLICY "public_counters_system_update" ON public.public_counters
  FOR ALL USING (true);

-- Trigger to update public_counters on connection_edges changes
CREATE OR REPLACE FUNCTION update_public_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.public_counters (entity_id, favorites_count, followers_count)
    VALUES (
      NEW.entity_id,
      CASE WHEN NEW.edge_type = 'favorite' THEN 1 ELSE 0 END,
      CASE WHEN NEW.edge_type = 'follow' THEN 1 ELSE 0 END
    )
    ON CONFLICT (entity_id) DO UPDATE SET
      favorites_count = public_counters.favorites_count + CASE WHEN NEW.edge_type = 'favorite' THEN 1 ELSE 0 END,
      followers_count = public_counters.followers_count + CASE WHEN NEW.edge_type = 'follow' THEN 1 ELSE 0 END,
      updated_at = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.public_counters
    SET
      favorites_count = GREATEST(0, favorites_count - CASE WHEN OLD.edge_type = 'favorite' THEN 1 ELSE 0 END),
      followers_count = GREATEST(0, followers_count - CASE WHEN OLD.edge_type = 'follow' THEN 1 ELSE 0 END),
      updated_at = now()
    WHERE entity_id = OLD.entity_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_public_counters
AFTER INSERT OR DELETE ON public.connection_edges
FOR EACH ROW EXECUTE FUNCTION update_public_counters();

-- RPC: Toggle connection (favorite/follow)
CREATE OR REPLACE FUNCTION connection_toggle(
  p_entity_id UUID,
  p_edge_type TEXT,
  p_apps TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_is_connected BOOLEAN;
BEGIN
  -- Validate edge_type
  IF p_edge_type NOT IN ('follow', 'favorite') THEN
    RAISE EXCEPTION 'Invalid edge_type';
  END IF;

  -- Check if connection exists
  SELECT id INTO v_existing_id
  FROM connection_edges
  WHERE user_id = auth.uid()
    AND entity_id = p_entity_id
    AND edge_type = p_edge_type;

  IF v_existing_id IS NOT NULL THEN
    -- Remove connection
    DELETE FROM connection_edges WHERE id = v_existing_id;
    v_is_connected := false;
  ELSE
    -- Add connection
    INSERT INTO connection_edges (user_id, entity_id, edge_type, scope)
    VALUES (
      auth.uid(),
      p_entity_id,
      p_edge_type,
      CASE WHEN p_apps IS NOT NULL 
        THEN jsonb_build_object('apps', to_jsonb(p_apps))
        ELSE '{}'::jsonb
      END
    );
    v_is_connected := true;

    -- Log to Rocker
    INSERT INTO ai_action_ledger (user_id, agent, action, input, output, result)
    VALUES (
      auth.uid(),
      'user',
      'connection_' || p_edge_type,
      jsonb_build_object('entity_id', p_entity_id, 'apps', p_apps),
      jsonb_build_object('connected', true),
      'success'
    );
  END IF;

  RETURN jsonb_build_object(
    'is_connected', v_is_connected,
    'edge_type', p_edge_type,
    'entity_id', p_entity_id
  );
END;
$$;