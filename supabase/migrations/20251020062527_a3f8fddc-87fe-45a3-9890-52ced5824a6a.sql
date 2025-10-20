-- ========== Project Titan Phase 2: DB Foundation ==========
-- Metrics logging for self-optimization + Entity graph for relational reasoning

-- ========== 1) METRICS: log what Rocker does (fuel for self-optimization) ==========
create table if not exists public.rocker_metrics (
  id           bigserial primary key,
  user_id      uuid,
  action       text,                 -- 'chat_turn', 'search', 'summarize', etc.
  latency_ms   int,
  tokens_in    int,
  tokens_out   int,
  retrieved_ids uuid[],
  scores       float[],
  low_conf     boolean,
  mrr          float,
  hit5         boolean,
  created_at   timestamptz default now()
);

create index if not exists idx_metrics_user_time
  on public.rocker_metrics(user_id, created_at desc);

-- RPC: safe insert (so you can call supabase.rpc('log_metric', ...))
create or replace function public.log_metric(
  p_user_id uuid,
  p_action text,
  p_latency_ms int,
  p_tokens_in int,
  p_tokens_out int,
  p_retrieved_ids uuid[],
  p_scores float[],
  p_low_conf boolean,
  p_mrr float,
  p_hit5 boolean
) returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.rocker_metrics(
    user_id, action, latency_ms, tokens_in, tokens_out,
    retrieved_ids, scores, low_conf, mrr, hit5
  ) values (
    p_user_id, p_action, p_latency_ms, p_tokens_in, p_tokens_out,
    p_retrieved_ids, p_scores, p_low_conf, p_mrr, p_hit5
  )
  returning id;
$$;

-- ========== 2) ENTITY GRAPH: people, companies, docs, relations ==========

create table if not exists public.rocker_entities (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,    -- 'person','company','project','topic','doc'
  name       text not null,
  meta       jsonb default '{}',
  created_at timestamptz default now()
);

create unique index if not exists uq_entities_kind_name
  on public.rocker_entities(lower(kind), lower(name));

create table if not exists public.rocker_edges (
  id         uuid primary key default gen_random_uuid(),
  src        uuid not null references public.rocker_entities(id) on delete cascade,
  dst        uuid not null references public.rocker_entities(id) on delete cascade,
  rel        text not null,    -- 'mentions','authored_by','related_to','depends_on'
  weight     float default 1.0,
  meta       jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_edges_src on public.rocker_edges(src);
create index if not exists idx_edges_dst on public.rocker_edges(dst);

-- RPC: idempotent upsert for entities (returns id)
create or replace function public.upsert_entity(p_kind text, p_name text, p_meta jsonb default '{}')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.rocker_entities
  where lower(kind)=lower(p_kind) and lower(name)=lower(p_name)
  limit 1;

  if v_id is null then
    insert into public.rocker_entities(kind, name, meta)
    values (p_kind, p_name, coalesce(p_meta,'{}'::jsonb))
    returning id into v_id;
  else
    update public.rocker_entities
      set meta = coalesce(rocker_entities.meta,'{}'::jsonb) || coalesce(p_meta,'{}'::jsonb)
    where id = v_id;
  end if;

  return v_id;
end;
$$;

-- RPC: create or bump an edge (aggregates weight)
create or replace function public.connect_entities(
  p_src uuid,
  p_dst uuid,
  p_rel text,
  p_weight float default 1.0,
  p_meta jsonb default '{}'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.rocker_edges
  where src = p_src and dst = p_dst and lower(rel)=lower(p_rel)
  limit 1;

  if v_id is null then
    insert into public.rocker_edges(src, dst, rel, weight, meta)
    values (p_src, p_dst, p_rel, coalesce(p_weight,1.0), coalesce(p_meta,'{}'::jsonb))
    returning id into v_id;
  else
    update public.rocker_edges
      set weight = least(coalesce(weight,1.0) + coalesce(p_weight,1.0), 10.0),
          meta   = coalesce(meta,'{}'::jsonb) || coalesce(p_meta,'{}'::jsonb),
          created_at = created_at
    where id = v_id;
  end if;

  return v_id;
end;
$$;

-- ========== 3) OPTIONAL: quick views to inspect learning progress ==========

create or replace view public.v_knowledge_health as
select
  count(*) as total_chunks,
  count(*) filter (where embedding is not null) as embedded_chunks,
  count(*) filter (where embedding is null)     as pending_chunks
from public.rocker_knowledge;

create or replace view public.v_top_entities as
select e.kind, e.name, count(*) as degree
from public.rocker_edges ed
join public.rocker_entities e on e.id = ed.src
group by 1,2
order by degree desc
limit 50;