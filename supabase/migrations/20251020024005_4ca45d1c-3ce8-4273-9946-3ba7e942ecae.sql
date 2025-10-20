-- Create or align rocker_files table and policies
-- 1) Table
create table if not exists public.rocker_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text,
  summary text,
  category text,
  tags text[] default '{}',
  status text not null default 'inbox' check (status in ('inbox','filed','archived')),
  folder_path text,
  starred boolean not null default false,
  source text, -- e.g. 'paste','upload','drive'
  created_at timestamptz not null default now()
);

-- 2) Ensure required columns exist (safe for existing installs)
alter table public.rocker_files add column if not exists user_id uuid not null;
alter table public.rocker_files add column if not exists name text;
alter table public.rocker_files add column if not exists summary text;
alter table public.rocker_files add column if not exists category text;
alter table public.rocker_files add column if not exists tags text[] default '{}';
alter table public.rocker_files add column if not exists status text not null default 'inbox' check (status in ('inbox','filed','archived'));
alter table public.rocker_files add column if not exists folder_path text;
alter table public.rocker_files add column if not exists starred boolean not null default false;
alter table public.rocker_files add column if not exists source text;
alter table public.rocker_files add column if not exists created_at timestamptz not null default now();

-- 3) Row Level Security and policies
alter table public.rocker_files enable row level security;
-- Policy: users can manage their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rocker_files' AND policyname = 'files_self'
  ) THEN
    CREATE POLICY files_self ON public.rocker_files
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- 4) Helpful indexes
create index if not exists rocker_files_user_status_created_idx 
  on public.rocker_files(user_id, status, created_at desc);
create index if not exists rocker_files_category_idx on public.rocker_files(category);
create index if not exists rocker_files_folder_idx on public.rocker_files(folder_path);

-- 5) Trigger function to default category when empty (optional, non-breaking)
create or replace function public.rocker_files_default_category()
returns trigger language plpgsql as $$
begin
  if new.category is null or length(coalesce(new.category,'')) = 0 then
    new.category := 'Notes';
  end if;
  return new;
end;$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rocker_files_default_category'
  ) THEN
    CREATE TRIGGER trg_rocker_files_default_category
    BEFORE INSERT ON public.rocker_files
    FOR EACH ROW EXECUTE FUNCTION public.rocker_files_default_category();
  END IF;
END$$;