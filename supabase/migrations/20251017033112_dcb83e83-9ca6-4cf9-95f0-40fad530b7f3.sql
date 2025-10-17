-- ========== UTIL: admin helper ==========
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'role') = 'admin', false)
$$;

-- ========== TABLE: ai_action_ledger ==========
-- Immutable log of everything Rocker/AdminRocker does
create table if not exists public.ai_action_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,                                   -- null = system action
  agent text not null check (agent in ('rocker','admin_rocker')),
  action text not null,                                -- e.g., 'create_listing', 'nudge_cart'
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  result text not null check (result in ('success','failure','pending')),
  correlation_id uuid null,                            -- group related steps
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_action_ledger_user on public.ai_action_ledger (user_id, created_at desc);
create index if not exists idx_ai_action_ledger_action on public.ai_action_ledger (action, created_at desc);

alter table public.ai_action_ledger enable row level security;

-- Owner (their own rows)
create policy ai_action_ledger_owner_read
on public.ai_action_ledger
for select
to authenticated
using (coalesce(user_id, auth.uid()) = auth.uid());

-- Admin full read
create policy ai_action_ledger_admin_read
on public.ai_action_ledger
for select
to authenticated
using (public.is_admin());

-- Inserts:
-- 1) A user may log their own actions (user_id = auth.uid())
-- 2) Admin may log for any user_id (including null)
create policy ai_action_ledger_insert_user
on public.ai_action_ledger
for insert
to authenticated
with check (
  (user_id is null and public.is_admin()) or
  (user_id = auth.uid())
);

-- No updates; deletes only by admin (rare)
create policy ai_action_ledger_delete_admin
on public.ai_action_ledger
for delete
to authenticated
using (public.is_admin());

-- ========== TABLE: ai_consent ==========
-- Per-user preferences for Rocker (proactive, channels, quiet hours, caps)
do $$
begin
  perform 1 from pg_type where typname = 'ai_channel';
  if not found then
    create type ai_channel as enum ('snackbar','dm','email','push');
  end if;
end$$;

create table if not exists public.ai_consent (
  user_id uuid primary key references auth.users(id) on delete cascade,
  proactive_enabled boolean not null default true,
  channels jsonb not null default jsonb_build_object('snackbar',true,'dm',true,'email',false,'push',false),
  quiet_hours int4range null, -- [start_hour, end_hour) 0-23; null = no quiet hours
  frequency_cap int not null default 5, -- max nudges/day
  updated_at timestamptz not null default now()
);

alter table public.ai_consent enable row level security;

create policy ai_consent_owner_rw
on public.ai_consent
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy ai_consent_admin_ro
on public.ai_consent
for select
to authenticated
using (public.is_admin());

create index if not exists idx_ai_consent_updated_at on public.ai_consent (updated_at desc);

-- ========== RPC: rocker_log_action ==========
-- Logs an action; enforces the same checks as RLS policies.
create or replace function public.rocker_log_action(
  p_user_id uuid,
  p_agent text,
  p_action text,
  p_input jsonb default '{}'::jsonb,
  p_output jsonb default '{}'::jsonb,
  p_result text default 'success',
  p_correlation_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Permission: either admin, or p_user_id = auth.uid(), or null only if admin
  if not public.is_admin() then
    if p_user_id is null or p_user_id <> auth.uid() then
      raise exception 'not allowed';
    end if;
  end if;

  insert into public.ai_action_ledger(user_id, agent, action, input, output, result, correlation_id)
  values (p_user_id, p_agent, p_action, coalesce(p_input,'{}'::jsonb), coalesce(p_output,'{}'::jsonb), p_result, p_correlation_id)
  returning id into v_id;

  return v_id;
end$$;

revoke all on function public.rocker_log_action(uuid, text, text, jsonb, jsonb, text, uuid) from public;
grant execute on function public.rocker_log_action(uuid, text, text, jsonb, jsonb, text, uuid) to authenticated;

-- ========== RPC: rocker_check_consent ==========
-- Returns whether Rocker may message this user right now for a given action type.
-- It respects quiet hours and daily frequency caps (counts today's Rocker nudges in the ledger).
create or replace function public.rocker_check_consent(
  p_user_id uuid,
  p_action_type text  -- e.g., 'nudge_cart','dm_referral'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consent public.ai_consent%rowtype;
  v_hour int;
  v_today date := current_date;
  v_sent_today int;
  v_allowed boolean := true;
  v_reasons text[] := '{}';
begin
  select * into v_consent
  from public.ai_consent
  where user_id = p_user_id;

  -- default if row missing
  if not found then
    v_consent.user_id := p_user_id;
    v_consent.proactive_enabled := true;
    v_consent.channels := jsonb_build_object('snackbar',true,'dm',true,'email',false,'push',false);
    v_consent.quiet_hours := null;
    v_consent.frequency_cap := 5;
  end if;

  -- quiet hours
  v_hour := extract(hour from now());
  if v_consent.quiet_hours is not null then
    if v_hour < lower(v_consent.quiet_hours) or v_hour >= upper(v_consent.quiet_hours) then
      -- outside quiet hours: ok
    else
      v_allowed := false;
      v_reasons := array_append(v_reasons, 'quiet_hours');
    end if;
  end if;

  -- frequency cap: count today's rocker actions that look like nudges/DMs
  select count(*) into v_sent_today
  from public.ai_action_ledger
  where user_id = p_user_id
    and agent = 'rocker'
    and created_at::date = v_today
    and (action like 'nudge_%' or action like 'dm_%');

  if v_sent_today >= v_consent.frequency_cap then
    v_allowed := false;
    v_reasons := array_append(v_reasons, 'frequency_cap');
  end if;

  -- proactive-only check (allow if the client is a direct user action; here we only report flag)
  if v_consent.proactive_enabled is false then
    v_reasons := array_append(v_reasons, 'proactive_disabled');
  end if;

  return jsonb_build_object(
    'allowed', v_allowed,
    'reasons', v_reasons,
    'sent_today', v_sent_today,
    'cap', v_consent.frequency_cap,
    'quiet_hours', v_consent.quiet_hours,
    'channels', v_consent.channels
  );
end$$;

revoke all on function public.rocker_check_consent(uuid, text) from public;
grant execute on function public.rocker_check_consent(uuid, text) to authenticated;

-- ========== VIEW: ai_action_my_timeline (convenience for UI) ==========
create or replace view public.ai_action_my_timeline as
select *
from public.ai_action_ledger
where coalesce(user_id, auth.uid()) = auth.uid();

grant select on public.ai_action_my_timeline to authenticated;