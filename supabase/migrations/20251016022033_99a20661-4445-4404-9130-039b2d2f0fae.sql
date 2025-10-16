-- Voice-to-Post tables and RPC

-- 1) post_drafts (optional staging area)
create table if not exists post_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) <= 5000),
  media_urls text[] default '{}',
  visibility text not null default 'public' check (visibility in ('public','followers','private')),
  created_at timestamptz not null default now()
);

alter table post_drafts enable row level security;

create policy "user can manage own drafts"
on post_drafts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2) Update posts table to support idempotency and visibility
alter table posts add column if not exists idempotency_key text unique;
alter table posts add column if not exists visibility text not null default 'public' check (visibility in ('public','followers','private'));
alter table posts add column if not exists media_urls text[] default '{}';

-- Update existing RLS policies
drop policy if exists "Users can view public posts" on posts;
create policy "user can read public or own"
on posts for select
using (visibility = 'public' or auth.uid() = author_id);

-- 3) Idempotent post creation RPC
create or replace function rpc_create_post(
  p_idempotency_key text,
  p_content text,
  p_visibility text default 'public',
  p_media_urls text[] default '{}'
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_tenant_id uuid;
begin
  -- Try existing (idempotent)
  select id into v_id from posts where idempotency_key = p_idempotency_key;
  if v_id is not null then return v_id; end if;

  -- Get tenant ID
  select coalesce(
    (select tenant_id from profiles where user_id = auth.uid()),
    auth.uid()
  ) into v_tenant_id;

  -- Create new post
  insert into posts (
    author_id,
    body,
    kind,
    tenant_id,
    media,
    idempotency_key
  )
  values (
    auth.uid(),
    p_content,
    case when array_length(p_media_urls, 1) > 0 then 'image' else 'text' end,
    v_tenant_id,
    case 
      when array_length(p_media_urls, 1) > 0 
      then (select jsonb_agg(jsonb_build_object('url', url, 'type', 'image')) from unnest(p_media_urls) as url)
      else '[]'::jsonb
    end,
    p_idempotency_key
  )
  returning id into v_id;

  return v_id;
end $$;

-- 4) Rate limiting table
create table if not exists voice_post_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  post_count int not null default 1,
  primary key (user_id, window_start)
);

alter table voice_post_rate_limits enable row level security;

-- 5) Rate limit check function
create or replace function check_voice_post_rate_limit(
  p_user_id uuid,
  p_max_posts int default 5,
  p_window_seconds int default 60
) returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_count int;
  v_window_start timestamptz;
begin
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  -- Clean old windows
  delete from voice_post_rate_limits 
  where user_id = p_user_id and window_start < v_window_start;
  
  -- Count posts in current window
  select coalesce(sum(post_count), 0) into v_count
  from voice_post_rate_limits
  where user_id = p_user_id and window_start >= v_window_start;
  
  if v_count >= p_max_posts then
    return false;
  end if;
  
  -- Increment counter
  insert into voice_post_rate_limits (user_id, window_start, post_count)
  values (p_user_id, now(), 1)
  on conflict (user_id, window_start) 
  do update set post_count = voice_post_rate_limits.post_count + 1;
  
  return true;
end $$;