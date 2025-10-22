-- Create efficient job status counts RPC
CREATE OR REPLACE FUNCTION public.job_status_counts()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status, count(*)::bigint
  FROM public.ai_jobs
  GROUP BY status;
$$;

GRANT EXECUTE ON FUNCTION public.job_status_counts() TO anon, authenticated, service_role;

-- RLS policies for control tables (super admins only)
CREATE POLICY "Super admins can update control flags" 
ON public.ai_control_flags
FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.super_admins));

CREATE POLICY "Super admins can update worker pools" 
ON public.ai_worker_pools
FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.super_admins));

CREATE POLICY "Super admins can view control flags" 
ON public.ai_control_flags
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.super_admins));

CREATE POLICY "Super admins can view worker pools" 
ON public.ai_worker_pools
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.super_admins));