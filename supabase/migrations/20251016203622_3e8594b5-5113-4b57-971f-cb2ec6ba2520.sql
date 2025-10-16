-- MODULE 2: Shared Creation Modals - Drafts System

-- 1) Draft types
do $$ begin
  create type draft_kind as enum ('post','listing','event');
exception when duplicate_object then null; end $$;

do $$ begin
  create type draft_status as enum ('draft','scheduled','published');
exception when duplicate_object then null; end $$;

-- 2) Drafts table (owner-scoped, optional profile ownership)
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  kind draft_kind not null,
  status draft_status not null default 'draft',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Utility trigger for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ 
begin 
  new.updated_at = now(); 
  return new; 
end $$;

drop trigger if exists trg_drafts_updated on public.drafts;
create trigger trg_drafts_updated before update on public.drafts
for each row execute function public.set_updated_at();

-- 4) RLS
alter table public.drafts enable row level security;
alter table public.drafts force row level security;

drop policy if exists drafts_rw on public.drafts;
create policy drafts_rw on public.drafts
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 5) Indexes
create index if not exists drafts_user_kind_status_idx on public.drafts (user_id, kind, status, updated_at desc);
create index if not exists drafts_profile_kind_idx on public.drafts (profile_id, kind);