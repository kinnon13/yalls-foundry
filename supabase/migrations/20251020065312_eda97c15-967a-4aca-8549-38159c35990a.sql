-- Gap detection system: signals → opportunities → money

-- 1) Capture gap signals from every interaction
create table if not exists public.rocker_gap_signals (
  id bigserial primary key,
  user_id uuid,
  kind text not null,
  query text,
  entities jsonb default '{}',
  score float default 0,
  meta jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_gap_signals_kind on public.rocker_gap_signals(kind);
create index if not exists idx_gap_signals_created on public.rocker_gap_signals(created_at desc);

-- 2) Ranked opportunities (drives action)
create table if not exists public.rocker_gap_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null,
  entities jsonb default '{}',
  size float not null,
  value float not null,
  effort float not null,
  priority float not null,
  evidence jsonb default '[]',
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_gap_opps_status on public.rocker_gap_opportunities(status);
create index if not exists idx_gap_opps_priority on public.rocker_gap_opportunities(priority desc) where status='open';

-- 3) Cluster signals into opportunity candidates
create or replace view public.v_gap_clusters as
with keyed as (
  select
    lower(coalesce(entities->>'crop','any')) as crop,
    lower(coalesce(entities->>'pest','any')) as pest,
    lower(coalesce(entities->>'equipment','any')) as equipment,
    lower(coalesce(entities->>'season','any')) as season,
    left(regexp_replace(query,'\s+',' ','g'), 80) as topic,
    kind, score, id, created_at
  from public.rocker_gap_signals
  where created_at > now() - interval '30 days'
)
select
  md5(crop||'|'||pest||'|'||equipment||'|'||season||'|'||topic||'|'||kind) as cluster_id,
  topic, kind, crop, pest, equipment, season,
  count(*)::float as size,
  avg(score) as pain,
  json_agg(id order by created_at desc) as evidence_ids,
  min(created_at) as first_seen,
  max(created_at) as last_seen
from keyed
group by topic, kind, crop, pest, equipment, season
having count(*) >= 2;

-- RLS: users see their own signals, admins see all
alter table public.rocker_gap_signals enable row level security;
create policy "Users view own gap signals" on public.rocker_gap_signals for select using (auth.uid() = user_id);
create policy "Admins view all gap signals" on public.rocker_gap_signals for select using (
  exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('admin','super_admin'))
);
create policy "System can insert gap signals" on public.rocker_gap_signals for insert with check (true);

alter table public.rocker_gap_opportunities enable row level security;
create policy "Admins manage opportunities" on public.rocker_gap_opportunities for all using (
  exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('admin','super_admin'))
);
create policy "Users view open opportunities" on public.rocker_gap_opportunities for select using (status='open');