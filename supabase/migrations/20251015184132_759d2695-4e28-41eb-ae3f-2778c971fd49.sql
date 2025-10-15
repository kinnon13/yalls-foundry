-- Create chat messages table for Rocker voice/text conversations
create table if not exists public.rocker_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.rocker_conversations enable row level security;

-- Recreate policies idempotently
drop policy if exists "Users can view own messages" on public.rocker_conversations;
create policy "Users can view own messages"
  on public.rocker_conversations
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own messages" on public.rocker_conversations;
create policy "Users can insert own messages"
  on public.rocker_conversations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own messages" on public.rocker_conversations;
create policy "Users can update own messages"
  on public.rocker_conversations
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own messages" on public.rocker_conversations;
create policy "Users can delete own messages"
  on public.rocker_conversations
  for delete
  using (auth.uid() = user_id);

-- Indexes for fast querying
create index if not exists idx_rocker_conv_user_session_created
  on public.rocker_conversations (user_id, session_id, created_at);

-- Add to realtime publication (ignore if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rocker_conversations;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
    NULL;
  END;
END $$;