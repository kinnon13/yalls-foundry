-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 2: Social + CRM Lite
-- ─────────────────────────────────────────────────────────────────────────────

-- PRELUDE: Create types if they don't exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'post_visibility') then
    create type post_visibility as enum ('public','followers','private');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('open','done','cancelled');
  end if;
end$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- POSTS (update existing or create new)
-- ─────────────────────────────────────────────────────────────────────────────
-- Check if posts table needs author_user_id column
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'posts' 
    and column_name = 'author_user_id'
  ) then
    -- Add author_user_id column if it doesn't exist
    alter table public.posts add column author_user_id uuid references auth.users(id) on delete cascade;
    
    -- Copy existing author_id to author_user_id
    update public.posts set author_user_id = author_id::uuid where author_id is not null;
  end if;

  -- Add entity_id if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'posts' 
    and column_name = 'entity_id'
  ) then
    alter table public.posts add column entity_id uuid references public.entities(id) on delete set null;
  end if;
end$$;

-- Update indexes
create index if not exists idx_posts_author_user on public.posts (author_user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- POST REACTIONS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.post_reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists idx_post_reactions_post on public.post_reactions (post_id, created_at desc);
alter table public.post_reactions enable row level security;

drop policy if exists post_reactions_visible_read on public.post_reactions;
create policy post_reactions_visible_read
on public.post_reactions for select to authenticated
using (exists (
  select 1 from public.posts p
  where p.id = post_id
    and (p.visibility = 'public' or p.author_user_id = auth.uid())
));

drop policy if exists post_reactions_owner_write on public.post_reactions;
create policy post_reactions_owner_write
on public.post_reactions for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists post_reactions_owner_delete on public.post_reactions;
create policy post_reactions_owner_delete
on public.post_reactions for delete to authenticated
using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- MESSAGES (DMs)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id                 uuid primary key default gen_random_uuid(),
  sender_user_id     uuid not null references auth.users(id) on delete cascade,
  recipient_user_id  uuid not null references auth.users(id) on delete cascade,
  body               text not null,
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);
create index if not exists idx_messages_duo on public.messages
  (least(sender_user_id, recipient_user_id), greatest(sender_user_id, recipient_user_id), created_at desc);
create index if not exists idx_messages_recipient on public.messages (recipient_user_id, created_at desc);
create index if not exists idx_messages_sender on public.messages (sender_user_id, created_at desc);
create index if not exists idx_messages_created on public.messages(created_at desc);
alter table public.messages enable row level security;

drop policy if exists messages_dual_read on public.messages;
create policy messages_dual_read
on public.messages for select to authenticated
using (sender_user_id = auth.uid() or recipient_user_id = auth.uid());

drop policy if exists messages_sender_insert on public.messages;
create policy messages_sender_insert
on public.messages for insert to authenticated
with check (sender_user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- CRM CONTACTS (update existing)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  -- Add owner_user_id if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'crm_contacts' 
    and column_name = 'owner_user_id'
  ) then
    alter table public.crm_contacts add column owner_user_id uuid references auth.users(id) on delete cascade;
  end if;

  -- Add tags if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'crm_contacts' 
    and column_name = 'tags'
  ) then
    alter table public.crm_contacts add column tags jsonb not null default '[]'::jsonb;
  end if;
end$$;

create index if not exists idx_crm_contacts_owner on public.crm_contacts(owner_user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- CRM EVENTS (update existing)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  -- Add owner_user_id if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'crm_events' 
    and column_name = 'owner_user_id'
  ) then
    alter table public.crm_events add column owner_user_id uuid references auth.users(id) on delete cascade;
  end if;

  -- Add kind if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'crm_events' 
    and column_name = 'kind'
  ) then
    alter table public.crm_events add column kind text;
  end if;

  -- Add data if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'crm_events' 
    and column_name = 'data'
  ) then
    alter table public.crm_events add column data jsonb not null default '{}'::jsonb;
  end if;

  -- Add happened_at if missing
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'crm_events' 
    and column_name = 'happened_at'
  ) then
    alter table public.crm_events add column happened_at timestamptz not null default now();
  end if;
end$$;

create index if not exists idx_crm_events_owner_time on public.crm_events(owner_user_id, happened_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  owner_user_id      uuid not null references auth.users(id) on delete cascade,
  subject            text not null,
  due_at             timestamptz null,
  status             task_status not null default 'open',
  related_entity_id  uuid null references public.entities(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_tasks_owner_due on public.tasks(owner_user_id, status, due_at nulls last);
alter table public.tasks enable row level security;

drop policy if exists tasks_owner_all on public.tasks;
create policy tasks_owner_all
on public.tasks for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- RPCs
-- ─────────────────────────────────────────────────────────────────────────────

-- Create a post (logs to AI ledger)
create or replace function public.post_create(
  p_body text,
  p_visibility post_visibility default 'public',
  p_entity_id uuid default null,
  p_media jsonb default '[]'::jsonb
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.posts(author_user_id, body, visibility, entity_id, media)
  values (auth.uid(), p_body, p_visibility, p_entity_id, coalesce(p_media,'[]'::jsonb))
  returning id into v_id;

  -- Audit
  perform public.rocker_log_action(auth.uid(), 'rocker', 'post_create',
           jsonb_build_object('entity_id', p_entity_id),
           jsonb_build_object('post_id', v_id), 'success', null);

  return v_id;
end$$;

grant execute on function public.post_create(text, post_visibility, uuid, jsonb) to authenticated;

-- Send a DM; auto-insert disclosure if we detect a referral link
create or replace function public.dm_send(
  p_recipient uuid,
  p_body text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_body text := p_body;
  v_meta jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_has_ref boolean := false;
begin
  if p_recipient = auth.uid() then
    raise exception 'cannot message yourself';
  end if;

  -- naive referral detection
  v_has_ref := (p_body ~* '(yalls\\.ai/\\S*\\b(r|ref|rl|/r/)\\b)') or (p_body ~* '\\bref=');

  if v_has_ref and coalesce((v_meta->>'disclosure_inserted')::boolean, false) = false then
    v_body := p_body || E'\n\n(Disclosure: includes my referral link.)';
    v_meta := jsonb_set(v_meta, '{disclosure_inserted}', 'true'::jsonb, true);
  end if;

  insert into public.messages(sender_user_id, recipient_user_id, body, metadata)
  values (auth.uid(), p_recipient, v_body, v_meta)
  returning id into v_id;

  -- Timeline for sender
  insert into public.crm_events(owner_user_id, contact_id, kind, data)
  values (
    auth.uid(),
    (select id from public.crm_contacts where owner_user_id = auth.uid()
       and (email = (select email from public.profiles where user_id = p_recipient) or false) limit 1),
    'dm_sent',
    jsonb_build_object('message_id', v_id, 'recipient_user_id', p_recipient)
  );

  -- Audit
  perform public.rocker_log_action(auth.uid(), 'rocker', 'dm_send',
           jsonb_build_object('recipient', p_recipient),
           jsonb_build_object('message_id', v_id, 'disclosure', v_has_ref), 'success', null);

  return v_id;
end$$;

grant execute on function public.dm_send(uuid, text, jsonb) to authenticated;

-- Upsert a CRM contact for the owner
create or replace function public.crm_contact_upsert(
  p_name text,
  p_email citext default null,
  p_phone text default null,
  p_tags jsonb default '[]'::jsonb
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Try match by email first, then phone
  select id into v_id from public.crm_contacts
   where owner_user_id = auth.uid()
     and ((p_email is not null and email = p_email) or (p_email is null and false))
  limit 1;

  if v_id is null and p_phone is not null then
    select id into v_id from public.crm_contacts
     where owner_user_id = auth.uid() and phone = p_phone
    limit 1;
  end if;

  if v_id is null then
    insert into public.crm_contacts(owner_user_id, name, email, phone, tags, business_id, tenant_id)
    values (auth.uid(), p_name, p_email, p_phone, coalesce(p_tags,'[]'::jsonb), 
            (select id from businesses limit 1), -- placeholder business_id
            auth.uid())
    returning id into v_id;
  else
    update public.crm_contacts
       set name = coalesce(p_name, name),
           email = coalesce(p_email, email),
           phone = coalesce(p_phone, phone),
           tags  = coalesce(p_tags, tags),
           updated_at = now()
     where id = v_id;
  end if;

  -- Audit
  perform public.rocker_log_action(auth.uid(), 'rocker', 'crm_contact_upsert',
           jsonb_build_object('email', p_email, 'phone', p_phone),
           jsonb_build_object('contact_id', v_id), 'success', null);

  return v_id;
end$$;

grant execute on function public.crm_contact_upsert(text, citext, text, jsonb) to authenticated;

-- Follow-up suggester
create or replace function public.rocker_generate_followup_list(
  p_days_idle int default 14
) returns table(contact_id uuid, name text, reason text)
language sql stable
as $$
  with last_touch as (
    select c.id as contact_id, c.name,
           coalesce(max(e.happened_at), timestamp 'epoch') as last_event
    from public.crm_contacts c
    left join public.crm_events e on e.owner_user_id = c.owner_user_id and e.contact_id = c.id
    where c.owner_user_id = auth.uid()
    group by c.id, c.name
  )
  select contact_id, name,
         'No activity in ' ||
         extract(day from (now() - last_event))::int || ' days' as reason
  from last_touch
  where last_event < now() - make_interval(days => p_days_idle)
  order by last_event asc
  limit 50;
$$;

grant execute on function public.rocker_generate_followup_list(int) to authenticated;