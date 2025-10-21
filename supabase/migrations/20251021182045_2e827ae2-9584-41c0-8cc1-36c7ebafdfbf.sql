-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add case-insensitive handle column with generated index
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS handle_lower text 
GENERATED ALWAYS AS (lower(handle)) STORED;

CREATE INDEX IF NOT EXISTS idx_profiles_handle_lower 
ON public.profiles (handle_lower);

-- Create minimal public view (expose only safe fields for search)
CREATE OR REPLACE VIEW public.public_profiles_min AS
SELECT 
  user_id, 
  handle, 
  display_name, 
  avatar_url, 
  handle_lower
FROM public.profiles
WHERE deleted_at IS NULL;

-- Create prefix search RPC (case-insensitive, limited results)
CREATE OR REPLACE FUNCTION public.search_profiles_prefix(
  q text, 
  lim int DEFAULT 10
)
RETURNS TABLE(
  user_id uuid, 
  handle text, 
  display_name text, 
  avatar_url text
)
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id, 
    handle, 
    display_name, 
    avatar_url
  FROM public_profiles_min
  WHERE handle_lower LIKE lower(q) || '%'
  ORDER BY handle_lower
  LIMIT GREATEST(1, LEAST(lim, 25));
$$;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles_min TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_prefix TO authenticated;