-- MODULE 3: Event Detail Modal - Simplified approach

-- Add columns without enum (use text for now)
alter table public.events
  add column if not exists host_profile_id uuid references public.profiles(id),
  add column if not exists location jsonb;

-- Simple RPC without visibility filtering for now (can add later)
create or replace function public.get_event_viewable(p_event_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  start_at timestamptz,
  end_at timestamptz,
  location jsonb,
  host_profile_id uuid,
  host_name text,
  host_avatar text,
  created_by uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select 
    e.id,
    e.title,
    e.description,
    e.starts_at as start_at,
    e.ends_at as end_at,
    e.location,
    e.host_profile_id,
    p.display_name as host_name,
    p.avatar_url as host_avatar,
    e.created_by,
    e.created_at
  from public.events e
  left join public.profiles p on p.id = coalesce(e.host_profile_id, e.created_by)
  where e.id = p_event_id
  limit 1;
$$;

grant execute on function public.get_event_viewable(uuid) to authenticated, anon;