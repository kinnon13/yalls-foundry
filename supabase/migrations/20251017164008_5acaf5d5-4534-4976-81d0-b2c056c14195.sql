-- PR5c: Add usage_events enhancements (keep backward compatible)

-- 1. Add new columns (keep old ones)
ALTER TABLE public.usage_events 
  ADD COLUMN IF NOT EXISTS surface TEXT DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS lane TEXT,
  ADD COLUMN IF NOT EXISTS position INT,
  ADD COLUMN IF NOT EXISTS duration_ms INT,
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. Make user_id NOT NULL
UPDATE public.usage_events SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
ALTER TABLE public.usage_events 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. Ensure defaults
ALTER TABLE public.usage_events 
  ALTER COLUMN payload SET DEFAULT '{}'::jsonb,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

-- 4. RLS
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_events_insert_own ON public.usage_events;
DROP POLICY IF EXISTS usage_events_read_own ON public.usage_events;
DROP POLICY IF EXISTS usage_events_admin_read ON public.usage_events;
DROP POLICY IF EXISTS usage_events_select_own ON public.usage_events;

CREATE POLICY usage_events_insert_own ON public.usage_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY usage_events_read_own ON public.usage_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY usage_events_admin_read ON public.usage_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

-- 5. Indexes (hot paths)
CREATE INDEX IF NOT EXISTS idx_usage_user_time
  ON public.usage_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_surface_lane
  ON public.usage_events (surface, lane, created_at DESC) 
  WHERE surface IS NOT NULL AND lane IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usage_type_item
  ON public.usage_events (event_type, item_type, item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_payload_gin
  ON public.usage_events USING gin (payload jsonb_path_ops);

-- 6. Flexible writer function (works with old + new schema)
CREATE OR REPLACE FUNCTION public.log_usage_event_v2(
  p_session_id TEXT,
  p_event_type TEXT,
  p_surface TEXT,
  p_item_kind TEXT,
  p_item_id UUID,
  p_lane TEXT DEFAULT NULL,
  p_position INT DEFAULT NULL,
  p_duration_ms INT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_events(
    user_id, session_id, event_type, item_type, item_id, payload,
    surface, lane, position, duration_ms, tenant_id, created_at
  )
  VALUES (
    auth.uid(), 
    p_session_id, 
    p_event_type, 
    p_item_kind, 
    p_item_id, 
    COALESCE(p_meta, '{}'::jsonb),
    p_surface,
    p_lane, 
    p_position, 
    p_duration_ms,
    auth.uid(),
    now()
  );
EXCEPTION WHEN OTHERS THEN
  -- Fail silently to keep UX smooth
  PERFORM 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_usage_event_v2(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, INT, INT, JSONB)
  TO authenticated, anon;