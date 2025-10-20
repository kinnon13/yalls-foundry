-- Create rocker_config table for runtime AI tuning parameters
CREATE TABLE IF NOT EXISTS public.rocker_config (
  id INT PRIMARY KEY DEFAULT 1,
  alpha FLOAT DEFAULT 0.7,
  mmr_lambda FLOAT DEFAULT 0.7,
  retrieve_k INT DEFAULT 20,
  keep_k INT DEFAULT 5,
  sim_threshold FLOAT DEFAULT 0.65,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rocker_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read config (service role will update)
CREATE POLICY "Anyone can read config" ON public.rocker_config
  FOR SELECT USING (true);

-- Only admins can update config
CREATE POLICY "Admins can update config" ON public.rocker_config
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default configuration
INSERT INTO public.rocker_config (id, alpha, mmr_lambda, retrieve_k, keep_k, sim_threshold, updated_at)
VALUES (1, 0.7, 0.7, 20, 5, 0.65, NOW())
ON CONFLICT (id) DO NOTHING;