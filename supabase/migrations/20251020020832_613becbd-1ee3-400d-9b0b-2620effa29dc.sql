-- Enhance rocker_files with auto-organization fields
alter table public.rocker_files add column if not exists category text;
alter table public.rocker_files add column if not exists tags text[] default '{}';
alter table public.rocker_files add column if not exists summary text;
alter table public.rocker_files add column if not exists text_content text;
alter table public.rocker_files add column if not exists ocr_text text;
alter table public.rocker_files add column if not exists folder_path text;
alter table public.rocker_files add column if not exists status text default 'inbox' check (status in ('inbox', 'filed', 'flagged'));
alter table public.rocker_files add column if not exists starred boolean default false;

-- Indexes for fast queries
create index if not exists idx_rocker_files_status on public.rocker_files(user_id, status);
create index if not exists idx_rocker_files_starred on public.rocker_files(user_id, starred);
create index if not exists idx_rocker_files_tags on public.rocker_files using gin(tags);
create index if not exists idx_rocker_files_category on public.rocker_files(category);

-- Views for quick access
create or replace view vw_files_inbox as
select * from public.rocker_files
where status = 'inbox'
order by created_at desc;

create or replace view vw_files_library as
select * from public.rocker_files
where status = 'filed'
order by created_at desc;

create or replace view vw_starred as
select * from public.rocker_files
where starred = true
order by created_at desc;

-- Google Drive sync tracking
create table if not exists public.drive_sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  drive_folder_id text not null,
  folder_name text not null,
  last_sync_at timestamptz,
  next_page_token text,
  enabled boolean default true,
  created_at timestamptz default now(),
  unique(user_id, drive_folder_id)
);

alter table public.drive_sync_state enable row level security;

create policy drive_sync_rw on public.drive_sync_state
for all using (public._owns_or_admin(auth.uid(), user_id))
with check (public._owns_or_admin(auth.uid(), user_id));

-- OAuth tokens (encrypted)
create table if not exists public.user_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  provider text not null,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_oauth_tokens enable row level security;

create policy oauth_tokens_own on public.user_oauth_tokens
for all using (user_id = auth.uid())
with check (user_id = auth.uid());