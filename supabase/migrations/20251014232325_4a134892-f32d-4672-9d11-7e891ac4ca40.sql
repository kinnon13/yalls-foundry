-- Refine RLS scanner to ignore extension/system tables
CREATE OR REPLACE FUNCTION public.get_tables_rls_status()
RETURNS TABLE (
  table_name text,
  table_schema text,
  rls_enabled boolean,
  policies jsonb,
  risk_level text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH t AS (
  SELECT c.relname::text AS tname,
         n.nspname::text AS tschema,
         c.relrowsecurity AS rls_on
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r' -- ordinary tables only
    -- Exclude objects that belong to extensions (PostGIS, etc.)
    AND NOT EXISTS (
      SELECT 1
      FROM pg_depend d
      JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.objid = c.oid AND d.deptype = 'e'
    )
    -- Explicit exclude list (safety net)
    AND c.relname NOT IN ('spatial_ref_sys','geometry_columns','geography_columns')
),
 p AS (
  SELECT c.relname::text AS tname,
         jsonb_agg(
           jsonb_build_object(
             'name', pol.polname,
             'command', CASE pol.polcmd
               WHEN 'r' THEN 'SELECT'
               WHEN 'a' THEN 'INSERT'
               WHEN 'w' THEN 'UPDATE'
               WHEN 'd' THEN 'DELETE'
               WHEN '*' THEN 'ALL'
               ELSE pol.polcmd::text
             END,
             'permissive', pol.polpermissive,
             'using', COALESCE(pg_get_expr(pol.polqual, pol.polrelid), ''),
             'check', COALESCE(pg_get_expr(pol.polwithcheck, pol.polrelid), '')
           ) ORDER BY pol.polname
         ) AS pols
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  GROUP BY c.relname
 )
SELECT t.tname AS table_name,
       t.tschema AS table_schema,
       t.rls_on AS rls_enabled,
       COALESCE(p.pols, '[]'::jsonb) AS policies,
       CASE 
         WHEN t.rls_on THEN 'safe'
         ELSE 'critical'
       END AS risk_level
FROM t
LEFT JOIN p ON p.tname = t.tname
ORDER BY t.tname;
$$;

GRANT EXECUTE ON FUNCTION public.get_tables_rls_status() TO anon, authenticated, service_role;