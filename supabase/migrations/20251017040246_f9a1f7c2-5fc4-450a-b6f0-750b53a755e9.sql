-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURES + CAPABILITY SYSTEM
-- ─────────────────────────────────────────────────────────────────────────────

-- Features table (nav items, tools, etc.)
create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  path text null,
  icon text null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Feature locations (where features appear: header, dashboard, sidebar, etc.)
create table if not exists public.feature_locations (
  feature_id uuid not null references public.features(id) on delete cascade,
  location text not null,
  sort_order int not null default 0,
  primary key (feature_id, location)
);

-- Account capabilities (per-user feature access)
create table if not exists public.account_capabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  enabled boolean not null default true,
  granted_at timestamptz not null default now(),
  granted_by uuid null references auth.users(id) on delete set null,
  unique (user_id, feature_id)
);

-- Indexes
create index if not exists idx_feature_locations_location on public.feature_locations(location);
create index if not exists idx_account_capabilities_user on public.account_capabilities(user_id, enabled);

-- RLS
alter table public.features enable row level security;
alter table public.feature_locations enable row level security;
alter table public.account_capabilities enable row level security;

-- Everyone can read features & locations
create policy features_public_read on public.features for select using (true);
create policy feature_locations_public_read on public.feature_locations for select using (true);

-- Users can read their own capabilities
create policy account_capabilities_owner_read on public.account_capabilities 
  for select using (auth.uid() = user_id);

-- Admins can manage capabilities
create policy account_capabilities_admin_all on public.account_capabilities
  for all using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Add read_at column to messages for badge count
alter table public.messages add column if not exists read_at timestamptz null;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Seed features
insert into public.features (key, label, path, icon, is_public)
values
  ('feed', 'Feed', '/feed', 'MessageSquare', true),
  ('messages', 'Messages', '/messages', 'Mail', true),
  ('crm', 'CRM', '/crm', 'Users', false)
on conflict (key) do nothing;

-- Seed locations (header + dashboard)
insert into public.feature_locations (feature_id, location, sort_order)
select f.id, 'header', 
  case f.key 
    when 'feed' then 1
    when 'messages' then 2
    when 'crm' then 3
  end
from public.features f
where f.key in ('feed', 'messages', 'crm')
on conflict do nothing;

insert into public.feature_locations (feature_id, location, sort_order)
select f.id, 'dashboard',
  case f.key 
    when 'feed' then 1
    when 'messages' then 2
    when 'crm' then 3
  end
from public.features f
where f.key in ('feed', 'messages', 'crm')
on conflict do nothing;