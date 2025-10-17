-- ========== Phase 1: Entity Graph & Claims ==========

-- ========== enums ==========
do $$
begin
  if not exists (select 1 from pg_type where typname = 'entity_kind') then
    create type entity_kind as enum ('person','business','horse','event');
  end if;
  if not exists (select 1 from pg_type where typname = 'entity_status') then
    create type entity_status as enum ('unclaimed','claimed','verified');
  end if;
  if not exists (select 1 from pg_type where typname = 'claim_status') then
    create type claim_status as enum ('pending','approved','rejected','canceled');
  end if;
  if not exists (select 1 from pg_type where typname = 'claim_method') then
    create type claim_method as enum ('email','sms','manual');
  end if;
end$$;

-- ========== table: entities ==========
create extension if not exists citext;

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  kind entity_kind not null,
  handle citext unique,
  display_name text not null,
  status entity_status not null default 'unclaimed',
  owner_user_id uuid null references auth.users(id) on delete set null,
  created_by_user_id uuid null references auth.users(id) on delete set null,
  contributor_window_days int not null default 60,
  window_expires_at timestamptz null,
  provenance jsonb not null default jsonb_build_object(),
  metadata jsonb not null default '{}'::jsonb,
  name_key text generated always as (
    lower(regexp_replace(display_name, '\s+', ' ', 'g'))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entities_kind on public.entities(kind, status);
create index if not exists idx_entities_namekey on public.entities(kind, name_key);
create index if not exists idx_entities_owner on public.entities(owner_user_id);

alter table public.entities enable row level security;

create policy entities_public_read
on public.entities
for select
to anon, authenticated
using (true);

create policy entities_owner_admin_update
on public.entities
for update
to authenticated
using (owner_user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role))
with check (owner_user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role));

create policy entities_admin_insert
on public.entities
for insert
to authenticated
with check (has_role(auth.uid(), 'admin'::app_role));

-- ========== table: entity_claims ==========
create table if not exists public.entity_claims (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  claimant_user_id uuid not null references auth.users(id) on delete cascade,
  method claim_method not null,
  contact_target text null,
  token_hash text null,
  token_expires_at timestamptz null,
  evidence jsonb not null default '{}'::jsonb,
  status claim_status not null default 'pending',
  reason text null,
  reviewed_by uuid null references auth.users(id),
  reviewed_at timestamptz null,
  first_seen_at timestamptz null,
  claimed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entity_claims_entity on public.entity_claims(entity_id, status, created_at desc);
create index if not exists idx_entity_claims_claimant on public.entity_claims(claimant_user_id, created_at desc);

alter table public.entity_claims enable row level security;

create policy entity_claims_owner_read
on public.entity_claims
for select
to authenticated
using (claimant_user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role));

create policy entity_claims_insert
on public.entity_claims
for insert
to authenticated
with check (claimant_user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role));

create policy entity_claims_admin_update
on public.entity_claims
for update
to authenticated
using (has_role(auth.uid(), 'admin'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role));

-- ========== table: contributors ==========
create table if not exists public.contributors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trust_score numeric not null default 0.50,
  entities_created int not null default 0,
  entities_claimed int not null default 0,
  bounties_logged_cents int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contributors enable row level security;

create policy contributors_owner_read
on public.contributors
for select
to authenticated
using (user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role));

create policy contributors_owner_update
on public.contributors
for update
to authenticated
using (user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role))
with check (user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role));

-- ========== table: claim_bounties ==========
create table if not exists public.claim_bounties (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  contributor_user_id uuid not null references auth.users(id) on delete cascade,
  claim_id uuid not null references public.entity_claims(id) on delete cascade,
  within_window boolean not null,
  window_days int not null,
  amount_cents int not null default 0,
  status text not null default 'logged',
  created_at timestamptz not null default now()
);

create index if not exists idx_claim_bounties_contributor on public.claim_bounties(contributor_user_id, created_at desc);

alter table public.claim_bounties enable row level security;

create policy claim_bounties_owner_read
on public.claim_bounties
for select
to authenticated
using (contributor_user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role));

-- ========== table: time_windows ==========
create table if not exists public.time_windows (
  key text primary key,
  days int not null check (days > 0),
  description text not null
);

insert into public.time_windows(key, days, description)
values
('contributor.30',30,'Contributor bounty window 30 days'),
('contributor.60',60,'Contributor bounty window 60 days'),
('contributor.90',90,'Contributor bounty window 90 days')
on conflict (key) do nothing;

-- ========== RPCs ==========

create or replace function public.slugify(p_text text)
returns text language sql immutable as $$
  select regexp_replace(lower(trim(p_text)), '[^a-z0-9_\.]+', '-', 'g')
$$;

create or replace function public.entity_create_unclaimed(
  p_kind entity_kind,
  p_display_name text,
  p_handle text default null,
  p_provenance jsonb default '{}'::jsonb,
  p_contributor_user_id uuid default null,
  p_window_key text default 'contributor.60'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_days int := 60;
  v_handle citext := null;
begin
  select days into v_days from public.time_windows where key = p_window_key;

  if p_handle is not null then
    v_handle := public.slugify(p_handle);
  end if;

  select id into v_id
  from public.entities
  where kind = p_kind
    and name_key = lower(regexp_replace(p_display_name, '\s+', ' ', 'g'))
  limit 1;

  if v_id is null then
    insert into public.entities(
      kind, handle, display_name, status,
      created_by_user_id, contributor_window_days, window_expires_at,
      provenance, metadata
    ) values (
      p_kind, v_handle, p_display_name, 'unclaimed',
      p_contributor_user_id, coalesce(v_days,60), now() + make_interval(days => coalesce(v_days,60)),
      coalesce(p_provenance,'{}'::jsonb), '{}'::jsonb
    )
    returning id into v_id;

    if p_contributor_user_id is not null then
      insert into public.contributors(user_id, entities_created)
      values (p_contributor_user_id, 1)
      on conflict (user_id) do update set entities_created = contributors.entities_created + 1;
    end if;
  end if;

  return v_id;
end$$;

grant execute on function public.entity_create_unclaimed(entity_kind, text, text, jsonb, uuid, text) to authenticated;

create or replace function public.entity_claim_start(
  p_entity_id uuid,
  p_method claim_method,
  p_contact_target text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.entity_claims(entity_id, claimant_user_id, method, contact_target, status, first_seen_at)
  values (p_entity_id, auth.uid(), p_method, p_contact_target, 'pending', now())
  returning id into v_id;

  return v_id;
end$$;

grant execute on function public.entity_claim_start(uuid, claim_method, text) to authenticated;

create or replace function public.entity_claim_approve(p_claim_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.entities%rowtype;
  v_claim  public.entity_claims%rowtype;
  v_within boolean := false;
  v_window int := 0;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'admin only';
  end if;

  select * into v_claim from public.entity_claims where id = p_claim_id for update;

  if v_claim.status <> 'pending' then
    raise exception 'claim not pending';
  end if;

  update public.entity_claims
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_claim_id;

  select * into v_entity from public.entities where id = v_claim.entity_id for update;

  update public.entities
  set status = case when v_entity.status = 'verified' then 'verified' else 'claimed' end,
      owner_user_id = v_claim.claimant_user_id,
      updated_at = now()
  where id = v_claim.entity_id;

  v_window := coalesce(v_entity.contributor_window_days, 60);
  v_within := (v_entity.created_at >= now() - make_interval(days => v_window));

  if v_entity.created_by_user_id is not null then
    insert into public.claim_bounties(entity_id, contributor_user_id, claim_id, within_window, window_days, amount_cents)
    values (v_entity.id, v_entity.created_by_user_id, v_claim.id, v_within, v_window, 0);
  end if;

  if v_entity.created_by_user_id is not null then
    update public.contributors
    set entities_claimed = contributors.entities_claimed + 1
    where user_id = v_entity.created_by_user_id;
  end if;

  return jsonb_build_object('entity_id', v_entity.id, 'owner_user_id', v_claim.claimant_user_id, 'bounty_logged', v_entity.created_by_user_id is not null, 'within_window', v_within);
end$$;

grant execute on function public.entity_claim_approve(uuid) to authenticated;

create or replace function public.entity_claim_reject(p_claim_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'admin only';
  end if;

  update public.entity_claims
  set status = 'rejected', reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_claim_id and status = 'pending';
end$$;

grant execute on function public.entity_claim_reject(uuid, text) to authenticated;

create or replace function public.contributor_window_status(p_entity_id uuid)
returns jsonb
language sql stable
as $$
  select jsonb_build_object(
    'expires_at', window_expires_at,
    'days_left', greatest(0, ceil(extract(epoch from (coalesce(window_expires_at, now()) - now())) / 86400.0))::int
  )
  from public.entities
  where id = p_entity_id
$$;

grant execute on function public.contributor_window_status(uuid) to anon, authenticated;

-- ========== Storage bucket ==========
insert into storage.buckets (id, name, public)
values ('entity-claims', 'entity-claims', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload claim evidence"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'entity-claims' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own claim evidence"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entity-claims' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Admins can view all claim evidence"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entity-claims' and
  has_role(auth.uid(), 'admin'::app_role)
);