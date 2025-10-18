\set ON_ERROR_STOP on

-- Simulate an authenticated user by setting JWT claims.
-- This requires Postgres settings that Supabase exposes in psql:
--   set local role authenticated;
--   set local "request.jwt.claims" = '{"sub":"<uuid>","role":"authenticated"}';

set local role authenticated;
set local "request.jwt.claims" = json_build_object(
  'sub', :'user_id',
  'role', 'authenticated'
)::json;

-- 1) Owned workspace rows SHOULD be visible (expect 1)
with t as (
  select count(*)::int as c
  from businesses b
  where b.id = :'own_entity'::uuid
)
select case when c = 1 then 1 else 1/0 end as owned_must_be_one from t;

-- 2) Foreign workspace rows SHOULD be invisible (expect 0)
with t as (
  select count(*)::int as c
  from businesses b
  where b.id = :'foreign_entity'::uuid
)
select case when c = 0 then 1 else 1/0 end as foreign_must_be_zero from t;
