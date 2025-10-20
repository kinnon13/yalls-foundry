-- Index for fast category filtering
create index if not exists idx_rk_meta_category 
on public.rocker_knowledge ((meta->>'category'));

-- Index for thread filtering
create index if not exists idx_rk_meta_thread 
on public.rocker_knowledge ((meta->>'thread_id'));

-- tsvector for fast full-text search
alter table public.rocker_knowledge 
add column if not exists content_tsv tsvector
generated always as (to_tsvector('simple', coalesce(content,''))) stored;

create index if not exists idx_rk_tsv 
on public.rocker_knowledge using gin (content_tsv);