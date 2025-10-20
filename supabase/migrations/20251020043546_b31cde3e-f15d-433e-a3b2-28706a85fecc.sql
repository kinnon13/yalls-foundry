-- A) Jobs table for parallel embedding processing
create table if not exists public.embedding_jobs (
  id uuid primary key default gen_random_uuid(),
  knowledge_id uuid not null references public.rocker_knowledge(id) on delete cascade,
  status text not null default 'pending',
  attempts int not null default 0,
  last_error text,
  priority int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_embed_jobs_status on public.embedding_jobs(status, updated_at);
create index if not exists idx_embed_jobs_priority on public.embedding_jobs(priority, updated_at);

-- B) Seed jobs for anything missing embeddings
insert into public.embedding_jobs (knowledge_id, priority)
select id, coalesce(((meta->>'priority')::int), 5)
from public.rocker_knowledge
where embedding is null
on conflict do nothing;

-- C) RLS: only service role can mutate
alter table public.embedding_jobs enable row level security;

create policy "service can see jobs" on public.embedding_jobs for select
  using (true);

create policy "service can insert" on public.embedding_jobs for insert
  with check (true);

create policy "service can update" on public.embedding_jobs for update
  using (true);

-- D) Helper RPC to enqueue missing rows on demand
create or replace function public.enqueue_missing_embeddings(p_limit int default 2000)
returns int language sql security definer as $$
  with src as (
    select id, coalesce(((meta->>'priority')::int), 5) as prio
    from public.rocker_knowledge
    where embedding is null
      and not exists (select 1 from public.embedding_jobs j where j.knowledge_id = rocker_knowledge.id)
    limit p_limit
  )
  insert into public.embedding_jobs(knowledge_id, priority)
  select id, prio from src
  on conflict do nothing
  returning 1;
$$;

-- E) Claim RPC (SKIP LOCKED) for parallel workers
create or replace function public.claim_embedding_jobs(p_limit int)
returns table(job_id uuid, knowledge_id uuid) 
language plpgsql security definer as $$
begin
  return query
  with c as (
    select id
    from public.embedding_jobs
    where status = 'pending'
    order by priority asc, updated_at asc
    for update skip locked
    limit p_limit
  )
  update public.embedding_jobs j
     set status = 'taken', attempts = j.attempts + 1, updated_at = now()
  from c
  where j.id = c.id
  returning j.id, j.knowledge_id;
end; $$;