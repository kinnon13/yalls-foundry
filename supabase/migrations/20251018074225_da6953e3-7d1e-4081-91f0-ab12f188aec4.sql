-- Dashboard North Star: User Network & Upcoming Events RPCs (FIXED)
-- Creates functions to show user's connected entities and upcoming events from network

-- get_user_network: Returns entities user is connected to (member, favorite, customer)
create or replace function get_user_network(p_user_id uuid)
returns table (entity_id uuid, rel text, weight numeric, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  with members as (
    select entity_id, 'member'::text as rel, 1.0::numeric as weight, 
           greatest(created_at, updated_at) as updated_at
    from entity_members
    where member_user_id = p_user_id
  ),
  favorites as (
    select entity_id, 'favorite'::text as rel, 0.6::numeric as weight, 
           created_at as updated_at
    from favorite_entities
    where user_id = p_user_id
  ),
  buyers as (
    select distinct ml.seller_profile_id as entity_id, 'customer'::text as rel, 
           0.8::numeric as weight, 
           max(o.created_at) as updated_at
    from orders o
    join order_line_items oli on oli.order_id = o.id
    join marketplace_listings ml on ml.id = oli.listing_id
    where o.user_id = p_user_id
    group by ml.seller_profile_id
  )
  select entity_id, rel, weight, updated_at from members
  union all
  select entity_id, rel, weight, updated_at from favorites
  union all
  select entity_id, rel, weight, updated_at from buyers
$$;

-- get_dashboard_upcoming_events: Returns upcoming events from user's network
create or replace function get_dashboard_upcoming_events(
  p_user_id uuid,
  p_horizon text default '30d'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days int := coalesce((regexp_match(p_horizon, '(\d+)d'))[1]::int, 30);
  v_until timestamptz := now() + make_interval(days => v_days);
  v_rows jsonb := '[]'::jsonb;
begin
  -- Log action
  insert into ai_action_ledger(user_id, agent, action, input, output, result)
  values (
    p_user_id, 
    'rocker', 
    'get_dashboard_upcoming_events',
    jsonb_build_object('horizon', p_horizon),
    '{}',
    'success'
  );

  -- Gather upcoming events from user's network
  with net as (
    select entity_id, max(weight) as weight
    from get_user_network(p_user_id)
    group by entity_id
  ),
  ev as (
    select e.id, e.host_profile_id as entity_id, e.title, e.starts_at, 
           e.entry_closes_at, e.location,
           (now() >= coalesce(e.entry_opens_at, now())
             and now() <= coalesce(e.entry_closes_at, now())
           ) as is_open_public
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
    'entry_closes_at', entry_closes_at,
    'location', location,
    'enterable', is_open_public,
    'enter_route', case
      when is_open_public then '/events/' || id || '/enter'
      else null
    end
  )) into v_rows
  from ev;

  return coalesce(v_rows, '[]'::jsonb);
end;
$$;