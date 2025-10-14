-- Fix: use quoted identifier for reserved word "table"
CREATE OR REPLACE FUNCTION public.get_tables_rls_status()
RETURNS TABLE (
  "table" text,
  schema text,
  rls_enabled boolean,
  policies jsonb,
  risk_level text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH t AS (
    SELECT c.relname AS "table",
           n.nspname AS schema,
           c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r' -- ordinary tables only
  ),
  p AS (
    SELECT c.relname AS "table",
           jsonb_agg(
             jsonb_build_object(
               'name', pol.polname,
               'command', pol.polcmd,
               'permissive', pol.polpermissive,
               'using', COALESCE(pg_get_expr(pol.polqual, pol.polrelid), ''),
               'check', COALESCE(pg_get_expr(pol.polwithcheck, pol.polrelid), '')
             ) ORDER BY pol.polname
           ) AS policies
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    GROUP BY c.relname
  )
  SELECT t."table",
         t.schema,
         t.rls_enabled,
         COALESCE(p.policies, '[]'::jsonb) AS policies,
         CASE WHEN t.rls_enabled THEN 'safe' ELSE 'critical' END AS risk_level
  FROM t
  LEFT JOIN p ON p."table" = t."table"
  ORDER BY t."table";
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tables_rls_status() TO anon, authenticated, service_role;
