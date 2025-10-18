-- Y'all App Store: Catalog, Installation, and Integration System
-- Creates tables for app marketplace, installed apps per workspace, and integrations

-- App catalog: curated list of available apps
create table if not exists app_catalog (
  key text primary key,
  name text not null,
  summary text,
  category text,
  icon text,
  scopes text[] default '{}',
  config_schema jsonb default '{}'::jsonb,
  pricing text default 'included',
  created_at timestamptz default now()
);

-- Installed apps per workspace
create table if not exists installed_apps (
  entity_id uuid not null references entities(id) on delete cascade,
  app_key text not null references app_catalog(key),
  config jsonb default '{}'::jsonb,
  installed_by uuid not null,
  installed_at timestamptz default now(),
  primary key (entity_id, app_key)
);

-- Integration connections (OAuth tokens live in secrets; metadata here)
create table if not exists integration_connections (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references entities(id) on delete cascade,
  app_key text references app_catalog(key),
  provider text,
  scopes text[] default '{}',
  status text default 'connected',
  created_at timestamptz default now()
);

-- Enable RLS
alter table app_catalog enable row level security;
alter table installed_apps enable row level security;
alter table integration_connections enable row level security;

-- RLS Policies for app_catalog (public read)
create policy "Everyone can view app catalog"
  on app_catalog for select
  using (true);

create policy "Admins can manage catalog"
  on app_catalog for all
  using (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for installed_apps (members can read, owners can manage)
create policy "Entity members can view installed apps"
  on installed_apps for select
  using (
    exists (
      select 1 from entity_members
      where entity_id = installed_apps.entity_id
      and member_user_id = auth.uid()
    ) or exists (
      select 1 from entities
      where id = installed_apps.entity_id
      and owner_user_id = auth.uid()
    )
  );

create policy "Entity owners can install apps"
  on installed_apps for insert
  with check (
    exists (
      select 1 from entities
      where id = installed_apps.entity_id
      and owner_user_id = auth.uid()
    )
  );

create policy "Entity owners can uninstall apps"
  on installed_apps for delete
  using (
    exists (
      select 1 from entities
      where id = installed_apps.entity_id
      and owner_user_id = auth.uid()
    )
  );

-- RLS Policies for integration_connections (same as installed_apps)
create policy "Entity members can view integrations"
  on integration_connections for select
  using (
    exists (
      select 1 from entity_members
      where entity_id = integration_connections.entity_id
      and member_user_id = auth.uid()
    ) or exists (
      select 1 from entities
      where id = integration_connections.entity_id
      and owner_user_id = auth.uid()
    )
  );

create policy "Entity owners can manage integrations"
  on integration_connections for all
  using (
    exists (
      select 1 from entities
      where id = integration_connections.entity_id
      and owner_user_id = auth.uid()
    )
  );

-- Seed app catalog with core apps
insert into app_catalog(key, name, summary, category, icon, scopes, pricing) values
  ('business_profile', 'Business Profile', 'Stand up your brand page', 'Identity', 'Building2', '{entities:write,images:write}', 'included'),
  ('unclaimed_finder', 'Unclaimed Finder', 'Locate & claim existing pages', 'Identity', 'Search', '{entities:read}', 'included'),
  ('horse_app', 'Horse App', 'Manage each horse like its own app', 'Operations', 'Horse', '{horses:read,horses:write}', 'included'),
  ('equinestats', 'EquineStats', 'Performance analytics & comps', 'Analytics', 'BarChart3', '{analytics:read}', 'included'),
  ('themes', 'Themes', 'Customize colors & density', 'Appearance', 'Palette', '{ui:write}', 'included'),
  ('payments_stripe', 'Stripe', 'Accept payments & payouts', 'Commerce', 'CreditCard', '{payments:write}', 'pro'),
  ('crm', 'CRM', 'Contact management & follow-ups', 'Operations', 'Users', '{crm:read,crm:write}', 'included'),
  ('messaging', 'Messaging', 'Team communication & DMs', 'Operations', 'MessageSquare', '{messages:read,messages:write}', 'included'),
  ('programs', 'Programs', 'Incentives & rewards', 'Operations', 'Award', '{programs:read,programs:write}', 'included'),
  ('events', 'Events', 'Event management & entries', 'Operations', 'Calendar', '{events:read,events:write}', 'included')
on conflict (key) do nothing;

-- RPCs for App Store
create or replace function list_apps(p_entity_id uuid default null, p_q text default null)
returns jsonb 
language sql 
stable 
security definer
set search_path = public
as $$
  select jsonb_agg(t)
  from (
    select c.key, c.name, c.summary, c.category, c.icon, c.pricing,
           case 
             when p_entity_id is not null then
               exists(
                 select 1 from installed_apps i
                 where i.entity_id = p_entity_id and i.app_key = c.key
               )
             else false
           end as installed
    from app_catalog c
    where (p_q is null or c.name ilike '%'||p_q||'%' or c.summary ilike '%'||p_q||'%')
    order by c.category, c.name
  ) t
$$;

create or replace function install_app(
  p_entity_id uuid, 
  p_app_key text, 
  p_config jsonb default '{}'::jsonb
)
returns void 
language plpgsql 
security definer 
set search_path = public 
as $$
begin
  -- Check membership
  if not exists (
    select 1 from entity_members 
    where entity_id = p_entity_id and member_user_id = auth.uid()
  ) and not exists (
    select 1 from entities
    where id = p_entity_id and owner_user_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  -- Install app
  insert into installed_apps(entity_id, app_key, config, installed_by)
  values (p_entity_id, p_app_key, coalesce(p_config,'{}'::jsonb), auth.uid())
  on conflict (entity_id, app_key) do update
  set config = excluded.config;

  -- Log to Rocker
  perform rocker_log_action(
    auth.uid(), 
    'app_store', 
    'install_app',
    jsonb_build_object('entity_id', p_entity_id, 'app_key', p_app_key),
    '{}'::jsonb, 
    'success', 
    p_entity_id
  );
end;
$$;

create or replace function uninstall_app(p_entity_id uuid, p_app_key text)
returns void 
language plpgsql 
security definer 
set search_path = public 
as $$
begin
  -- Check membership
  if not exists (
    select 1 from entity_members 
    where entity_id = p_entity_id and member_user_id = auth.uid()
  ) and not exists (
    select 1 from entities
    where id = p_entity_id and owner_user_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  delete from installed_apps 
  where entity_id = p_entity_id and app_key = p_app_key;

  -- Log to Rocker
  perform rocker_log_action(
    auth.uid(), 
    'app_store', 
    'uninstall_app',
    jsonb_build_object('entity_id', p_entity_id, 'app_key', p_app_key),
    '{}'::jsonb, 
    'success', 
    p_entity_id
  );
end;
$$;