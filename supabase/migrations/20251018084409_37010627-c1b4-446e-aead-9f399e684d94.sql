-- user_pins table with proper constraints and indexing
create table if not exists public.user_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_type text not null check (pin_type in ('entity','app','route','folder')),
  ref_id text not null,
  title text,
  metadata jsonb not null default '{}'::jsonb,
  folder_id uuid null,
  sort_index numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, pin_type, ref_id)
);

-- helpful indices
create index if not exists user_pins_user_idx on public.user_pins(user_id, sort_index);
create index if not exists user_pins_folder_idx on public.user_pins(folder_id);

-- default sort_index: place at end in O(1)
create or replace function public._pin_next_index(p_user uuid)
returns numeric language sql stable as $$
  select coalesce(max(sort_index), 0) + 1024 from public.user_pins where user_id = p_user
$$;

create or replace function public._pin_set_default_index()
returns trigger language plpgsql as $$
begin
  if new.sort_index is null then
    new.sort_index := public._pin_next_index(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_pins_default_index on public.user_pins;
create trigger trg_user_pins_default_index
before insert on public.user_pins
for each row execute function public._pin_set_default_index();

-- RLS
alter table public.user_pins enable row level security;

drop policy if exists user_pins_sel on public.user_pins;
create policy user_pins_sel on public.user_pins
  for select using (user_id = auth.uid());

drop policy if exists user_pins_ins on public.user_pins;
create policy user_pins_ins on public.user_pins
  for insert with check (user_id = auth.uid());

drop policy if exists user_pins_upd on public.user_pins;
create policy user_pins_upd on public.user_pins
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_pins_del on public.user_pins;
create policy user_pins_del on public.user_pins
  for delete using (user_id = auth.uid());