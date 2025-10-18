-- Enhanced feature_introspect to include function security details
CREATE OR REPLACE FUNCTION public.feature_introspect(rpcs text[], tables text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res jsonb := jsonb_build_object('rpcs','[]'::jsonb,'tables','[]'::jsonb);
  fn text;
  tbl text;
BEGIN
  -- RPC existence + security info
  FOREACH fn IN ARRAY rpcs LOOP
    res := jsonb_set(
      res, '{rpcs}',
      (res->'rpcs') || (
        SELECT COALESCE(
          jsonb_build_object(
            'name', fn,
            'exists', true,
            'security_definer', p.prosecdef,
            'arg_count', p.pronargs
          ),
          jsonb_build_object('name', fn, 'exists', false)
        )
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = fn
        LIMIT 1
      )
    );
  END LOOP;

  -- Table existence + RLS flag
  FOREACH tbl IN ARRAY tables LOOP
    res := jsonb_set(
      res, '{tables}',
      (res->'tables') || (
        WITH cls AS (
          SELECT c.relname AS name, n.nspname AS ns, c.relrowsecurity AS rls
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = REPLACE(tbl, 'public.', '')
        )
        SELECT COALESCE(
          jsonb_build_object('name', tbl, 'exists', true, 'rls', (SELECT rls FROM cls LIMIT 1)),
          jsonb_build_object('name', tbl, 'exists', false, 'rls', false)
        )
      )
    );
  END LOOP;

  RETURN res;
END $$;