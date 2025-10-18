-- Replace feature_introspect with comprehensive version that can discover all DB objects
DROP FUNCTION IF EXISTS public.feature_introspect(text[], text[]);

CREATE OR REPLACE FUNCTION public.feature_introspect(
  p_rpcs text[] DEFAULT NULL,
  p_tables text[] DEFAULT NULL,
  p_introspect_all boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rpcs   text[];
  v_tables text[];
  res jsonb := jsonb_build_object('rpcs','[]'::jsonb,'tables','[]'::jsonb);
  fn text;
  tbl text;
BEGIN
  -- Compute universe when p_introspect_all is true
  IF p_introspect_all THEN
    SELECT ARRAY_AGG(routine_name)::text[]
    INTO v_rpcs
    FROM information_schema.routines
    WHERE routine_schema = 'public';

    SELECT ARRAY_AGG(table_name)::text[]
    INTO v_tables
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type='BASE TABLE';
  ELSE
    v_rpcs   := COALESCE(p_rpcs, ARRAY[]::text[]);
    v_tables := COALESCE(p_tables, ARRAY[]::text[]);
  END IF;

  -- RPC existence check with security definer and arg count
  FOREACH fn IN ARRAY v_rpcs LOOP
    res := jsonb_set(
      res, '{rpcs}',
      (res->'rpcs') || (
        WITH fn_info AS (
          SELECT 
            r.routine_name,
            p.prosecdef AS security_definer,
            p.pronargs AS arg_count
          FROM information_schema.routines r
          LEFT JOIN pg_proc p ON p.proname = r.routine_name
          LEFT JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
          WHERE r.routine_schema='public' AND r.routine_name=fn
          LIMIT 1
        )
        SELECT COALESCE(
          (SELECT jsonb_build_object(
            'name', fn,
            'exists', TRUE,
            'security_definer', security_definer,
            'arg_count', arg_count
          ) FROM fn_info),
          jsonb_build_object('name', fn, 'exists', FALSE)
        )
      )
    );
  END LOOP;

  -- Table existence + RLS flag check
  FOREACH tbl IN ARRAY v_tables LOOP
    res := jsonb_set(
      res, '{tables}',
      (res->'tables') || (
        WITH found AS (
          SELECT c.relname AS name, c.relrowsecurity AS rls
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname='public' AND c.relkind='r' AND c.relname = tbl
        )
        SELECT COALESCE(
          jsonb_build_object('name', tbl, 'exists', TRUE,  'rls', (SELECT rls FROM found LIMIT 1)),
          jsonb_build_object('name', tbl, 'exists', FALSE, 'rls', FALSE)
        )
      )
    );
  END LOOP;

  RETURN res;
END;
$$;