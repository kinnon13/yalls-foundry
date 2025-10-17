-- Features catalog (what can be gated)
create table if not exists public.feature_catalog (
  id           text primary key,
  title        text not null,
  tier_hint    text not null default 'free',
  meta         jsonb not null default '{}'::jsonb
);

-- Plans (what customers buy)
create table if not exists public.billing_plans (
  id           text primary key,
  meta         jsonb not null default '{}'::jsonb
);

-- Plan → Feature mapping
create table if not exists public.plan_entitlements (
  plan_id      text references public.billing_plans(id) on delete cascade,
  feature_id   text references public.feature_catalog(id) on delete cascade,
  primary key (plan_id, feature_id)
);

-- Active subscription per (tenant,user)
create table if not exists public.user_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid,
  user_id      uuid references auth.users(id) on delete cascade,
  plan_id      text references public.billing_plans(id),
  starts_at    timestamptz not null default now(),
  ends_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- Per-user or per-tenant overrides
create table if not exists public.entitlement_overrides (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid,
  user_id      uuid references auth.users(id) on delete cascade,
  feature_id   text references public.feature_catalog(id),
  allow        boolean not null,
  created_at   timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;
alter table public.entitlement_overrides enable row level security;

-- RLS: users read only their own rows
create policy sub_select on public.user_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

create policy over_select on public.entitlement_overrides
  for select to authenticated
  using (user_id = auth.uid() or user_id is null);

-- Fast lookups (removed WHERE clause with now())
create index if not exists idx_sub_active on public.user_subscriptions(user_id, plan_id);
create index if not exists idx_ent_overrides on public.entitlement_overrides(user_id, feature_id);

-- Canonical entitlement check
create or replace function public.has_feature(p_feature_id text, p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public
as $$
  with active_sub as (
    select coalesce(plan_id, 'free') as plan_id
    from user_subscriptions
    where user_id = p_user_id
      and (ends_at is null or ends_at > now())
    order by starts_at desc
    limit 1
  ),
  plan_allows as (
    select 1
    from plan_entitlements pe
    join active_sub s on s.plan_id = pe.plan_id
    where pe.feature_id = p_feature_id
  ),
  overrides as (
    select allow
    from entitlement_overrides eo
    where (eo.user_id = p_user_id or eo.user_id is null)
      and eo.feature_id = p_feature_id
    order by eo.user_id desc nulls last, eo.created_at desc
    limit 1
  )
  select coalesce((select allow from overrides), exists(select 1 from plan_allows), false);
$$;

grant execute on function public.has_feature(text,uuid) to authenticated;

-- Bulk pull (for client cache)
create or replace function public.get_entitlements(p_user_id uuid default auth.uid())
returns table(feature_id text)
language sql stable security definer
set search_path = public
as $$
  select fc.id as feature_id
  from feature_catalog fc
  where public.has_feature(fc.id, p_user_id);
$$;

grant execute on function public.get_entitlements(uuid) to authenticated;

-- Seed the catalog
insert into public.feature_catalog(id, title, tier_hint) values
  ('approvals', 'Feed Approvals', 'pro'),
  ('calendar', 'Calendar', 'free'),
  ('earnings', 'Earnings', 'pro')
on conflict (id) do nothing;

insert into public.billing_plans(id) values 
  ('free'),
  ('pro'),
  ('enterprise') 
on conflict (id) do nothing;

insert into public.plan_entitlements(plan_id, feature_id) values
  ('free', 'calendar'),
  ('pro', 'calendar'),
  ('pro', 'approvals'),
  ('pro', 'earnings'),
  ('enterprise', 'calendar'),
  ('enterprise', 'approvals'),
  ('enterprise', 'earnings')
on conflict (plan_id, feature_id) do nothing;