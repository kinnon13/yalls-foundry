-- Read-only feature probe for scanner
-- Checks existence of tables/functions without modifying data
create or replace function public.feature_probe(
  p_tables text[],
  p_functions text[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tables jsonb := '[]'::jsonb;
  funcs  jsonb := '[]'::jsonb;
  t text;
  f text;
begin
  -- Check table existence and RLS status
  foreach t in array p_tables loop
    tables := tables || jsonb_build_object(
      'name', t,
      'exists', exists(
        select 1 from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' 
          and c.relname = t 
          and c.relkind = 'r'
      ),
      'rls', coalesce((
        select c.relrowsecurity
        from pg_class c 
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' 
          and c.relname = t 
          and c.relkind = 'r'
      ), false)
    );
  end loop;

  -- Check function existence
  foreach f in array p_functions loop
    funcs := funcs || jsonb_build_object(
      'name', f,
      'exists', exists(
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' 
          and p.proname = f
      )
    );
  end loop;

  return jsonb_build_object('tables', tables, 'functions', funcs);
end;
$$;