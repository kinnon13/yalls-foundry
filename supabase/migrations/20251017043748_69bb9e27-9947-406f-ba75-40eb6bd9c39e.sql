-- Safe migration: Add host_entity_id to events (zero-downtime)

-- 1) Add the new column (nullable for now)
alter table public.events
add column if not exists host_entity_id uuid references public.entities(id) on delete set null;

create index if not exists idx_events_host_entity on public.events(host_entity_id);

-- 2) Helper: map a legacy profile -> entity (creates an owned person-entity if missing)
create or replace function public._map_profile_to_entity(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_entity_id uuid;
  v_display text;
begin
  -- assume profiles(user_id pk/fk)
  select user_id, display_name
    into v_user_id, v_display
  from public.profiles
  where user_id = p_profile_id
  limit 1;

  if v_user_id is null then
    return null;
  end if;

  -- try to find an existing claimed entity owned by this user
  select id into v_entity_id
  from public.entities
  where owner_user_id = v_user_id
  order by created_at asc
  limit 1;

  if v_entity_id is not null then
    return v_entity_id;
  end if;

  -- otherwise, create a minimal claimed person-entity for this user
  insert into public.entities(
    kind, handle, display_name, status, owner_user_id, provenance
  ) values (
    'person', public.slugify(coalesce(v_display, 'user-'||left(v_user_id::text,6))),
    coalesce(v_display, 'User'), 'claimed', v_user_id,
    jsonb_build_object('source','host_profile_migration')
  )
  returning id into v_entity_id;

  return v_entity_id;
end$$;

-- 3) Backfill existing rows (idempotent)
update public.events e
set host_entity_id = public._map_profile_to_entity(e.host_profile_id)
where e.host_entity_id is null
  and e.host_profile_id is not null;

-- 4) Legacy-write shim: if someone still writes host_profile_id, also set host_entity_id
create or replace function public._events_legacy_write_shim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.host_entity_id is null and new.host_profile_id is not null then
    new.host_entity_id := public._map_profile_to_entity(new.host_profile_id);
  end if;
  return new;
end$$;

drop trigger if exists trg_events_legacy_write_shim on public.events;
create trigger trg_events_legacy_write_shim
before insert or update of host_profile_id on public.events
for each row
execute function public._events_legacy_write_shim();