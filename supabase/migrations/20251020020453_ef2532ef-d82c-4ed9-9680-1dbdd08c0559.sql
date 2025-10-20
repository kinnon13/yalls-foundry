-- Enable pgvector extension
create extension if not exists vector;

-- Long-term memory table with embeddings
create table if not exists public.rocker_long_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  kind text not null check (kind in ('profile','preference','paste','file','note','task','crm','finance','doc')),
  key text,
  value jsonb not null,
  embedding vector(768),
  priority int not null default 100,
  pinned boolean default false,
  source text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_long_memory_user on public.rocker_long_memory(user_id, priority);
create index idx_long_memory_kind on public.rocker_long_memory(kind);
create index idx_long_memory_embed on public.rocker_long_memory using ivfflat(embedding vector_cosine_ops) with (lists=200);

-- File registry
create table if not exists public.rocker_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  thread_id uuid references public.rocker_threads(id) on delete set null,
  name text,
  mime text,
  size bigint,
  storage_path text,
  status text default 'ready',
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists public.rocker_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  thread_id uuid references public.rocker_threads(id) on delete set null,
  title text not null,
  status text not null default 'open' check (status in ('open','doing','blocked','done','cancelled')),
  due_at timestamptz,
  recur text,
  context jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_tasks_user_status on public.rocker_tasks(user_id, status);

-- RLS policies
alter table public.rocker_long_memory enable row level security;
alter table public.rocker_files enable row level security;
alter table public.rocker_tasks enable row level security;

-- Helper function for ownership check with super admin override
create or replace function public._owns_or_admin(uid uuid, row_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (uid = row_uid) or public.is_super_admin(uid);
$$;

-- Memory policies
create policy memory_rw on public.rocker_long_memory
for all using (public._owns_or_admin(auth.uid(), user_id))
with check (public._owns_or_admin(auth.uid(), user_id));

-- Files policies
create policy files_rw on public.rocker_files
for all using (public._owns_or_admin(auth.uid(), user_id))
with check (public._owns_or_admin(auth.uid(), user_id));

-- Tasks policies
create policy tasks_rw on public.rocker_tasks
for all using (public._owns_or_admin(auth.uid(), user_id))
with check (public._owns_or_admin(auth.uid(), user_id));

-- Semantic search function for memory recall
create or replace function public.recall_long_memory(p_query text, p_limit int default 12)
returns table(id uuid, kind text, key text, value jsonb, score float)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.kind, m.key, m.value, 0.9 as score
  from public.rocker_long_memory m
  where public._owns_or_admin(auth.uid(), m.user_id)
  order by m.priority asc, m.created_at desc
  limit p_limit;
$$;

-- Update runtime flags for Super Rocker
insert into public.runtime_flags(key, value) values
('super_rocker.enabled', '{"enabled": true}'::jsonb),
('super_rocker.max_upload_mb', '{"value": 25}'::jsonb),
('super_rocker.autotask_from_todo', '{"enabled": true}'::jsonb)
on conflict (key) do nothing;