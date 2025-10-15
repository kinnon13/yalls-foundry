-- Add policy config table
create table if not exists public.ai_policy_config (
  tenant_id uuid primary key,
  required_policy_version text not null default 'v1',
  updated_at timestamptz default now()
);

-- Update ai_user_consent with site opt-in fields
alter table public.ai_user_consent
  add column if not exists site_opt_in boolean not null default false,
  add column if not exists policy_version text not null default 'v1',
  add column if not exists consented_at timestamptz,
  add column if not exists ip inet,
  add column if not exists user_agent text,
  add column if not exists email_opt_in boolean not null default false,
  add column if not exists push_opt_in boolean not null default false,
  add column if not exists sms_opt_in boolean not null default false;

-- Helper: check if user has site opt-in
create or replace function public.has_site_opt_in(p_tenant uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select site_opt_in from public.ai_user_consent
    where tenant_id = p_tenant and user_id = p_user
  ), false)
$$;

-- Helper: check if user is admin
create or replace function public.is_admin(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = p_user and role = 'admin'
  )
$$;

-- RLS policies for key tables requiring opt-in
-- Example: ai_user_memory requires opt-in
drop policy if exists memory_insert_requires_optin on public.ai_user_memory;
create policy memory_insert_requires_optin
  on public.ai_user_memory for insert
  with check (
    public.has_site_opt_in(tenant_id, user_id) 
    or public.is_admin(auth.uid())
  );

drop policy if exists memory_select_requires_optin on public.ai_user_memory;
create policy memory_select_requires_optin
  on public.ai_user_memory for select
  using (
    public.has_site_opt_in(tenant_id, user_id)
    or public.is_admin(auth.uid())
  );

-- Profiles can be read by everyone but updates require opt-in
drop policy if exists profiles_update_requires_optin on public.profiles;
create policy profiles_update_requires_optin
  on public.profiles for update
  using (
    auth.uid() = user_id and (
      public.has_site_opt_in('00000000-0000-0000-0000-000000000000'::uuid, user_id)
      or public.is_admin(auth.uid())
    )
  );

-- Consent records: users can manage their own
drop policy if exists consent_user_self on public.ai_user_consent;
create policy consent_user_self
  on public.ai_user_consent for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can view all consent
drop policy if exists consent_admin_view on public.ai_user_consent;
create policy consent_admin_view
  on public.ai_user_consent for select
  using (public.has_role(auth.uid(), 'admin'));

-- Index for fast consent checks
create index if not exists idx_consent_user_optin 
  on public.ai_user_consent (tenant_id, user_id, site_opt_in);

-- Seed default policy version
insert into public.ai_policy_config (tenant_id, required_policy_version)
values ('00000000-0000-0000-0000-000000000000', 'v1')
on conflict (tenant_id) do nothing;