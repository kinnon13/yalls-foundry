-- Context-Aware Kernels: Connections & Eligibility
-- Enables relationship-driven kernel mounting and scoped access

-- ============================================================
-- 1) Connections table (who relates to what)
-- ============================================================
create table if not exists public.connections (
  id           uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user','entity','horse','profile')),
  subject_id   uuid not null,
  relation     text not null check (relation in ('follows','owns','assigned','member','invited')),
  object_type  text not null check (object_type in ('incentive','horse','project','page','entity','event','listing','work_package')),
  object_id    uuid not null,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  expires_at   timestamptz,
  unique (subject_type, subject_id, relation, object_type, object_id)
);

create index if not exists idx_connections_subject 
  on public.connections(subject_type, subject_id, relation);

create index if not exists idx_connections_object 
  on public.connections(object_type, object_id);

create index if not exists idx_connections_expires 
  on public.connections(expires_at) 
  where expires_at is not null;

alter table public.connections enable row level security;

-- Users can view their own connections
drop policy if exists connections_self_read on public.connections;
create policy connections_self_read
  on public.connections
  for select
  to authenticated
  using (
    (subject_type = 'user' and subject_id = auth.uid())
    or created_by = auth.uid()
  );

-- Users can create their own connections
drop policy if exists connections_self_write on public.connections;
create policy connections_self_write
  on public.connections
  for insert
  to authenticated
  with check (
    (subject_type = 'user' and subject_id = auth.uid())
    or created_by = auth.uid()
  );

-- Users can delete their own connections
drop policy if exists connections_self_delete on public.connections;
create policy connections_self_delete
  on public.connections
  for delete
  to authenticated
  using (
    (subject_type = 'user' and subject_id = auth.uid())
    or created_by = auth.uid()
  );

-- ============================================================
-- 2) Incentive eligibility (materialized or view)
-- ============================================================
create table if not exists public.incentives (
  id              uuid primary key default gen_random_uuid(),
  program_name    text not null,
  deadline_at     timestamptz not null,
  entry_fee_cents int not null default 0,
  eligibility_rules jsonb not null default '{}'::jsonb,
  status          text not null default 'active' check (status in ('active','closed','draft')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.incentives enable row level security;

-- Everyone can view active incentives (discovery mode)
drop policy if exists incentives_public_read on public.incentives;
create policy incentives_public_read
  on public.incentives
  for select
  to authenticated
  using (status = 'active');

-- Eligibility view
create or replace view public.v_incentive_eligibility as
select
  h.id               as horse_id,
  i.id               as incentive_id,
  i.program_name,
  i.deadline_at,
  (now() < i.deadline_at and i.status = 'active') as is_open,
  -- Add more eligibility checks here (breed, age, registration)
  true as meets_rules
from entities h
cross join public.incentives i
where h.kind = 'horse';

-- ============================================================
-- 3) Action gating for incentives
-- ============================================================
create or replace function public.has_incentive_action(
  p_user_id uuid,
  p_horse_id uuid,
  p_incentive_id uuid
) returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    -- Must have entitlement
    public.has_feature('incentives', p_user_id)
    -- Must have relationship to the horse
    and exists (
      select 1 from public.connections c
      where c.subject_type = 'user' 
        and c.subject_id = p_user_id
        and c.relation in ('owns','assigned')
        and c.object_type = 'horse'
        and c.object_id = p_horse_id
    )
    -- Horse must be eligible
    and exists (
      select 1 from public.v_incentive_eligibility v
      where v.horse_id = p_horse_id 
        and v.incentive_id = p_incentive_id
        and v.is_open 
        and v.meets_rules
    );
$$;

grant execute on function public.has_incentive_action(uuid,uuid,uuid) to authenticated;

-- ============================================================
-- 4) Get user's connection-driven kernels
-- ============================================================
create or replace function public.get_user_connection_kernels(p_user_id uuid default auth.uid())
returns table(
  kernel_type text,
  object_id uuid,
  context_data jsonb,
  priority int,
  source text
)
language sql stable security definer
set search_path = public
as $$
  -- Active connections that should spawn kernels
  select
    case c.object_type
      when 'incentive' then 'incentives'
      when 'project' then 'work_packages'
      when 'event' then 'events'
      else c.object_type
    end as kernel_type,
    c.object_id,
    c.metadata as context_data,
    case c.relation
      when 'owns' then 10
      when 'assigned' then 9
      when 'follows' then 5
      else 3
    end as priority,
    'connection' as source
  from public.connections c
  where c.subject_type = 'user'
    and c.subject_id = p_user_id
    and (c.expires_at is null or c.expires_at > now())
  order by priority desc, c.created_at desc
  limit 20;
$$;

grant execute on function public.get_user_connection_kernels(uuid) to authenticated;

-- ============================================================
-- 5) Incentive nomination RPC (example action)
-- ============================================================
create table if not exists public.incentive_nominations (
  id              uuid primary key default gen_random_uuid(),
  incentive_id    uuid not null references public.incentives(id) on delete cascade,
  horse_id        uuid not null,
  nominator_user_id uuid not null references auth.users(id),
  status          text not null default 'pending' check (status in ('pending','approved','rejected','entered')),
  fee_paid        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (incentive_id, horse_id)
);

alter table public.incentive_nominations enable row level security;

-- Users can view their own nominations
drop policy if exists incentive_nominations_self on public.incentive_nominations;
create policy incentive_nominations_self
  on public.incentive_nominations
  for select
  to authenticated
  using (nominator_user_id = auth.uid());

-- Nominate a horse for an incentive
create or replace function public.incentive_nominate(
  p_horse_id uuid,
  p_incentive_id uuid,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_nomination_id uuid;
  v_can_act boolean;
begin
  -- Check entitlements & eligibility
  v_can_act := public.has_incentive_action(auth.uid(), p_horse_id, p_incentive_id);
  
  if not v_can_act then
    raise exception 'not_entitled_or_ineligible';
  end if;

  -- Create nomination
  insert into public.incentive_nominations(
    incentive_id, 
    horse_id, 
    nominator_user_id, 
    status
  )
  values (p_incentive_id, p_horse_id, auth.uid(), 'pending')
  on conflict (incentive_id, horse_id) 
  do update set updated_at = now()
  returning id into v_nomination_id;

  -- Audit & observability
  insert into public.ai_action_ledger(user_id, agent, action, input, output, result)
  values (
    auth.uid(),
    'user',
    'incentive_nominate',
    jsonb_build_object('horse_id', p_horse_id, 'incentive_id', p_incentive_id),
    jsonb_build_object('nomination_id', v_nomination_id),
    'success'
  );

  return v_nomination_id;
end;
$$;

grant execute on function public.incentive_nominate(uuid,uuid,jsonb) to authenticated;

-- ============================================================
-- 6) Work packages pattern (GC/subcontractor)
-- ============================================================
create table if not exists public.work_packages (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null,
  role            text not null check (role in ('plumber','electrician','framer','general','other')),
  title           text not null,
  description     text,
  assigned_to     uuid references auth.users(id),
  status          text not null default 'pending' check (status in ('pending','in_progress','review','complete')),
  due_date        date,
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.work_packages enable row level security;

-- Creator and assigned can view
drop policy if exists work_packages_access on public.work_packages;
create policy work_packages_access
  on public.work_packages
  for select
  to authenticated
  using (
    created_by = auth.uid() 
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.connections c
      where c.subject_type = 'user'
        and c.subject_id = auth.uid()
        and c.object_type = 'project'
        and c.object_id = work_packages.project_id
    )
  );

-- Auto-create connection when work package is assigned
create or replace function public.trigger_work_package_connection()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if NEW.assigned_to is not null then
    insert into public.connections(
      subject_type, subject_id, relation, object_type, object_id, metadata, created_by
    )
    values (
      'user', 
      NEW.assigned_to, 
      'assigned', 
      'work_package', 
      NEW.id,
      jsonb_build_object('role', NEW.role, 'project_id', NEW.project_id),
      NEW.created_by
    )
    on conflict (subject_type, subject_id, relation, object_type, object_id) 
    do update set metadata = excluded.metadata, created_at = now();
  end if;
  return NEW;
end;
$$;

drop trigger if exists work_package_connection_trigger on public.work_packages;
create trigger work_package_connection_trigger
  after insert or update of assigned_to on public.work_packages
  for each row
  execute function public.trigger_work_package_connection();

-- ============================================================
-- 7) Connection metrics
-- ============================================================
create or replace function public.connection_metrics(p_window_hours int default 24)
returns table(
  relation text,
  object_type text,
  count bigint
)
language sql stable security definer
set search_path = public
as $$
  select 
    c.relation,
    c.object_type,
    count(*)::bigint
  from public.connections c
  where c.created_at >= now() - make_interval(hours => p_window_hours)
  group by c.relation, c.object_type
  order by count desc;
$$;

grant execute on function public.connection_metrics(int) to authenticated;