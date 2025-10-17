-- PR1: UI Prefs & Profile Dynamic Features

-- 1. User UI Preferences
CREATE TABLE IF NOT EXISTS public.user_ui_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs JSONB NOT NULL DEFAULT '{
    "theme": "system",
    "density": "comfortable",
    "accentColor": "blue",
    "headerStyle": "default",
    "linkStyle": "cards",
    "coverLayout": "banner"
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_ui_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their UI prefs" ON user_ui_prefs
  FOR ALL USING (user_id = auth.uid());

-- 2. Entity UI Preferences
CREATE TABLE IF NOT EXISTS public.entity_ui_prefs (
  entity_id UUID PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
  prefs JSONB NOT NULL DEFAULT '{
    "theme": "system",
    "density": "comfortable",
    "accentColor": "blue",
    "headerStyle": "default",
    "linkStyle": "cards",
    "coverLayout": "banner"
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE entity_ui_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entity owners manage UI prefs" ON entity_ui_prefs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM entities
      WHERE entities.id = entity_ui_prefs.entity_id
      AND entities.owner_user_id = auth.uid()
    )
  );

-- 3. Profile Pinned Items (bubbles)
CREATE TABLE IF NOT EXISTS public.profile_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('entity', 'page', 'link', 'action')),
  item_id UUID,
  item_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, position)
);

CREATE INDEX idx_profile_pins_profile ON profile_pins(profile_id, position);

ALTER TABLE profile_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their pins" ON profile_pins
  FOR ALL USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 4. Favorite Entities (for link bars)
CREATE TABLE IF NOT EXISTS public.favorite_entities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entity_id)
);

ALTER TABLE favorite_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their favorites" ON favorite_entities
  FOR ALL USING (user_id = auth.uid());

-- 5. Function: Aggregate counts for user profiles
CREATE OR REPLACE FUNCTION public.get_user_aggregate_counts(p_user_id UUID)
RETURNS TABLE (
  followers_count BIGINT,
  following_count BIGINT,
  likes_count BIGINT
) LANGUAGE sql STABLE AS $$
  -- Sum counts across all entities owned by user
  SELECT 
    COALESCE(SUM((e.metadata->>'followers_count')::bigint), 0) as followers_count,
    COALESCE(SUM((e.metadata->>'following_count')::bigint), 0) as following_count,
    COALESCE(SUM((e.metadata->>'likes_count')::bigint), 0) as likes_count
  FROM entities e
  WHERE e.owner_user_id = p_user_id;
$$;

-- 6. Function: Reorder pins
CREATE OR REPLACE FUNCTION public.reorder_pins(
  p_profile_id UUID,
  p_pin_positions JSONB
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pin_update RECORD;
BEGIN
  -- p_pin_positions format: [{"id": "uuid", "position": 0}, ...]
  FOR pin_update IN SELECT * FROM jsonb_to_recordset(p_pin_positions) AS x(id UUID, position INT)
  LOOP
    UPDATE profile_pins
    SET position = pin_update.position
    WHERE id = pin_update.id
    AND profile_id = p_profile_id;
  END LOOP;

  -- Log to Rocker ledger
  INSERT INTO ai_action_ledger(user_id, agent, action, input, output, result)
  VALUES (
    auth.uid(),
    'user',
    'profile_pins_reorder',
    jsonb_build_object('profile_id', p_profile_id, 'positions', p_pin_positions),
    jsonb_build_object('success', true),
    'success'
  );
END $$;

-- Trigger for updated_at
CREATE TRIGGER set_user_ui_prefs_updated_at
  BEFORE UPDATE ON user_ui_prefs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_entity_ui_prefs_updated_at
  BEFORE UPDATE ON entity_ui_prefs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();