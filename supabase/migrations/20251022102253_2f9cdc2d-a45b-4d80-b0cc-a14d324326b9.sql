-- Add proactivity level to user profiles
alter table public.ai_user_profiles
  add column if not exists proactivity_level text 
  check (proactivity_level in ('low','medium','high')) 
  default 'medium';

-- Set default for existing rows
update public.ai_user_profiles 
set proactivity_level = 'medium' 
where proactivity_level is null;

-- Create UI events table for telemetry
create table if not exists public.ui_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  event text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.ui_events enable row level security;

-- Service role can insert events
create policy "Service role can insert events"
  on public.ui_events
  for insert
  to service_role
  with check (true);

-- Users can view their own events
create policy "Users can view own events"
  on public.ui_events
  for select
  using (auth.uid() = user_id);

-- Index for performance
create index if not exists ui_events_created_idx 
  on public.ui_events(created_at desc);

create index if not exists ui_events_user_idx 
  on public.ui_events(user_id, created_at desc);

-- Add comment
comment on table public.ui_events is 'Telemetry and analytics events from UI';
