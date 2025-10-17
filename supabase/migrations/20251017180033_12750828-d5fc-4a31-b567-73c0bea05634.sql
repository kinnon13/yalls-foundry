-- Farm Ops tables (additive only)
create table if not exists public.farm_horses (
  id uuid primary key default gen_random_uuid(),
  owner_entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null,
  dob date,
  created_at timestamptz not null default now()
);

alter table public.farm_horses enable row level security;

create policy farm_horses_rw on public.farm_horses for all using (
  exists(select 1 from entities e where e.id=owner_entity_id and e.owner_user_id = auth.uid())
) with check (
  exists(select 1 from entities e where e.id=owner_entity_id and e.owner_user_id = auth.uid())
);

create table if not exists public.care_plans (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.farm_horses(id) on delete cascade,
  title text not null,
  schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.care_plans enable row level security;

create policy care_plans_rw on public.care_plans for all using (
  exists(select 1 from farm_horses h join entities e on e.id=h.owner_entity_id where h.id=horse_id and e.owner_user_id=auth.uid())
) with check (
  exists(select 1 from farm_horses h join entities e on e.id=h.owner_entity_id where h.id=horse_id and e.owner_user_id=auth.uid())
);