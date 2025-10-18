-- Fix get_dashboard_upcoming_events function to work with actual events table schema
CREATE OR REPLACE FUNCTION public.get_dashboard_upcoming_events(
  p_user_id uuid,
  p_horizon text DEFAULT '30d'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_days int := coalesce((regexp_match(p_horizon, '(\d+)d'))[1]::int, 30);
  v_until timestamptz := now() + make_interval(days => v_days);
  v_rows jsonb := '[]'::jsonb;
begin
  -- Gather upcoming events from user's network
  with net as (
    select entity_id, max(weight) as weight
    from get_user_network(p_user_id)
    group by entity_id
  ),
  ev as (
    select e.id, e.host_profile_id as entity_id, e.title, e.starts_at, 
           e.ends_at, e.location
    from events e
    join net n on n.entity_id = e.host_profile_id
    where e.starts_at <= v_until
      and e.starts_at >= now() - interval '1 day'
    order by e.starts_at asc
    limit 100
  )
  select jsonb_agg(jsonb_build_object(
    'event_id', id,
    'entity_id', entity_id,
    'title', title,
    'starts_at', starts_at,
    'ends_at', ends_at,
    'location', location,
    'enterable', true,
    'enter_route', '/events/' || id || '/enter'
  )) into v_rows
  from ev;

  return coalesce(v_rows, '[]'::jsonb);
end;
$$;