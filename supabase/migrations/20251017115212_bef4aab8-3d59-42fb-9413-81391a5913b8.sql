-- Context-aware kernel discovery (fixed: removed now() from index)

CREATE TABLE IF NOT EXISTS public.kernel_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kernel_type TEXT NOT NULL,
  context_entity_id UUID,
  context_data JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL,
  priority INT DEFAULT 100,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes without immutable functions
CREATE INDEX idx_kernel_contexts_user_type ON public.kernel_contexts(user_id, kernel_type);
CREATE INDEX idx_kernel_contexts_entity ON public.kernel_contexts(context_entity_id, kernel_type);
CREATE INDEX idx_kernel_contexts_expires ON public.kernel_contexts(expires_at) WHERE expires_at IS NOT NULL;

-- Get user's active kernel contexts
CREATE OR REPLACE FUNCTION public.get_user_kernels(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  kernel_id UUID,
  kernel_type TEXT,
  context_entity_id UUID,
  context_data JSONB,
  source TEXT,
  priority INT,
  entity_display_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    kc.id,
    kc.kernel_type,
    kc.context_entity_id,
    kc.context_data,
    kc.source,
    kc.priority,
    e.display_name
  FROM kernel_contexts kc
  LEFT JOIN entities e ON e.id = kc.context_entity_id
  WHERE kc.user_id = p_user_id
    AND (kc.expires_at IS NULL OR kc.expires_at > now())
  ORDER BY kc.priority ASC, kc.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_kernels(UUID) TO authenticated;

-- RLS
ALTER TABLE public.kernel_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY kernel_contexts_owner_read ON public.kernel_contexts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY kernel_contexts_admin_all ON public.kernel_contexts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));