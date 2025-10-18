-- Clean out any old overloads first
DROP FUNCTION IF EXISTS public.feature_introspect(text[], text[]);
DROP FUNCTION IF EXISTS public.feature_introspect(p_rpcs text[], p_tables text[]);
DROP FUNCTION IF EXISTS public.feature_introspect();

-- Create the canonical version
CREATE OR REPLACE FUNCTION public.feature_introspect(
  p_rpcs           text[]  DEFAULT ARRAY[]::text[],
  p_tables         text[]  DEFAULT ARRAY[]::text[],
  p_introspect_all boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rpcs   text[] := COALESCE(p_rpcs,   ARRAY[]::text[]);
  v_tables text[] := COALESCE(p_tables, ARRAY[]::text[]);
  fn  text;
  tbl text;
  res jsonb := jsonb_build_object('rpcs','[]'::jsonb,'tables','[]'::jsonb);
BEGIN
  -- When introspect_all, expand to all public functions/tables
  IF p_introspect_all THEN
    SELECT COALESCE(array_agg(routine_name::text ORDER BY routine_name), ARRAY[]::text[])
    INTO v_rpcs
    FROM information_schema.routines
    WHERE specific_schema='public';

    SELECT COALESCE(array_agg(table_name::text ORDER BY table_name), ARRAY[]::text[])
    INTO v_tables
    FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE';
  END IF;

  -- RPCs
  FOREACH fn IN ARRAY v_rpcs LOOP
    res := jsonb_set(res,'{rpcs}', (res->'rpcs') || (
      WITH fn_info AS (
        SELECT
          r.routine_name,
          COALESCE(p.prosecdef,false) AS security_definer,
          COALESCE(p.pronargs,0)      AS arg_count
        FROM information_schema.routines r
        LEFT JOIN pg_proc p       ON p.proname = r.routine_name
        LEFT JOIN pg_namespace n  ON n.oid = p.pronamespace
        WHERE r.specific_schema='public'
          AND r.routine_name = fn
          AND n.nspname='public'
        LIMIT 1
      )
      SELECT COALESCE(
        jsonb_build_object(
          'name', fn,
          'exists', true,
          'security_definer', (SELECT security_definer FROM fn_info),
          'arg_count',        (SELECT arg_count FROM fn_info)
        ),
        jsonb_build_object('name', fn, 'exists', false)
      )
    ));
  END LOOP;

  -- Tables (+ RLS flag)
  FOREACH tbl IN ARRAY v_tables LOOP
    res := jsonb_set(res,'{tables}', (res->'tables') || (
      WITH found AS (
        SELECT c.relname AS name, c.relrowsecurity AS rls
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname='public' AND c.relkind='r' AND c.relname = tbl
      )
      SELECT COALESCE(
        jsonb_build_object('name', tbl, 'exists', true,  'rls', (SELECT rls FROM found)),
        jsonb_build_object('name', tbl, 'exists', false, 'rls', false)
      )
    ));
  END LOOP;

  RETURN res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.feature_introspect(text[], text[], boolean) TO anon, authenticated;