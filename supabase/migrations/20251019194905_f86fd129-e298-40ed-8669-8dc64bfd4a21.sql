-- Enable RLS on apps table
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view apps (public catalog)
CREATE POLICY "Everyone can view apps catalog"
ON public.apps
FOR SELECT
USING (true);