-- Create result_flags table for event result issues
CREATE TABLE IF NOT EXISTS public.result_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  entry_data JSONB NOT NULL,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Add RLS policies
ALTER TABLE public.result_flags ENABLE ROW LEVEL SECURITY;

-- Users can create flags
CREATE POLICY "Users can create result flags"
ON public.result_flags
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_user_id);

-- Users can view their own flags
CREATE POLICY "Users can view their own result flags"
ON public.result_flags
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_user_id);

-- Event creators can view flags for their events
CREATE POLICY "Event creators can view result flags"
ON public.result_flags
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = result_flags.event_id
    AND events.created_by = auth.uid()
  )
);

-- Admins can view and update all flags
CREATE POLICY "Admins can manage result flags"
ON public.result_flags
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- Create content_flags table for marketplace/user/review/comment flags
CREATE TABLE IF NOT EXISTS public.content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('listing', 'user', 'review', 'comment')),
  content_id UUID NOT NULL,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Add RLS policies for content_flags
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create content flags"
ON public.content_flags
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view their own content flags"
ON public.content_flags
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can manage content flags"
ON public.content_flags
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- Create flag_content RPC function
CREATE OR REPLACE FUNCTION public.flag_content(
  p_content_type TEXT,
  p_content_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag_id UUID;
BEGIN
  -- Validate content type
  IF p_content_type NOT IN ('listing', 'user', 'review', 'comment') THEN
    RAISE EXCEPTION 'Invalid content type';
  END IF;

  -- Insert flag
  INSERT INTO public.content_flags (
    content_type,
    content_id,
    reporter_user_id,
    reason,
    details
  ) VALUES (
    p_content_type,
    p_content_id,
    auth.uid(),
    p_reason,
    p_details
  )
  RETURNING id INTO v_flag_id;

  RETURN v_flag_id;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_result_flags_event_id ON public.result_flags(event_id);
CREATE INDEX IF NOT EXISTS idx_result_flags_status ON public.result_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_content ON public.content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON public.content_flags(status);