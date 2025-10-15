-- Identity + Outbox Hardening (External ID Priority + Race Protection) - Fixed

-- Ensure helper schema exists
create schema if not exists app;

-- Add processing_token to outbox for claim-based delivery
alter table public.outbox
  add column if not exists processing_token uuid;

-- Update outbox index to exclude claimed rows
drop index if exists idx_outbox_undelivered;
create index idx_outbox_undelivered
  on public.outbox(tenant_id, delivered_at, created_at)
  where delivered_at is null and processing_token is null;

-- Claim-batch RPC using CTE (SQL UPDATE doesn't support ORDER BY directly)
create or replace function app.outbox_claim(p_limit int, p_token uuid)
returns setof public.outbox
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select id
    from public.outbox
    where delivered_at is null
      and processing_token is null
    order by created_at
    limit p_limit
  )
  update public.outbox o
     set processing_token = p_token
    from candidates c
   where o.id = c.id
   returning o.*;
$$;

-- Enhanced contact resolver with externalId priority + advisory locks
create or replace function app.resolve_contact(
  p_business uuid,
  p_email    text,
  p_phone    text,
  p_ext_id   text,
  p_name     text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact uuid;
  v_changed boolean := false;
  v_email   text := case when p_email is null then null else lower(p_email) end;
  v_phone   text := p_phone;
begin
  -- Advisory locks to prevent races (hash per identity type)
  if p_ext_id is not null then perform pg_advisory_xact_lock(hashtext('ext:'||p_ext_id)); end if;
  if v_email  is not null then perform pg_advisory_xact_lock(hashtext('em:'||v_email));   end if;
  if v_phone  is not null then perform pg_advisory_xact_lock(hashtext('ph:'||v_phone));   end if;

  -- 1) Resolve by external_id FIRST (highest priority)
  if p_ext_id is not null then
    select contact_id into v_contact
      from contact_identities
     where type='external_id' and value=p_ext_id
     limit 1;
  end if;

  -- 2) Then email identity
  if v_contact is null and v_email is not null then
    select contact_id into v_contact
      from contact_identities
     where type='email' and value=v_email
     limit 1;
  end if;

  -- 3) Then phone identity
  if v_contact is null and v_phone is not null then
    select contact_id into v_contact
      from contact_identities
     where type='phone' and value=v_phone
     limit 1;
  end if;

  -- 4) Fallback to crm_contacts by business_id + email
  if v_contact is null and v_email is not null then
    select id into v_contact
      from crm_contacts
     where business_id = p_business and lower(email)=v_email
     limit 1;
  end if;

  -- 5) Create new contact if still missing
  if v_contact is null then
    insert into crm_contacts(business_id, name, email, phone, status)
    values (p_business, nullif(p_name,''), v_email, v_phone, 'lead')
    returning id into v_contact;
    v_changed := true;
  end if;

  -- 6) Ensure identity links exist (with proper conflict targets)
  if p_ext_id is not null then
    insert into contact_identities(tenant_id, contact_id, type, value)
    values (app.current_tenant_id(), v_contact, 'external_id', p_ext_id)
    on conflict (tenant_id, type, value) do update
      set contact_id = excluded.contact_id;
  end if;

  if v_email is not null then
    insert into contact_identities(tenant_id, contact_id, type, value)
    values (app.current_tenant_id(), v_contact, 'email', v_email)
    on conflict (tenant_id, type, value) do update
      set contact_id = excluded.contact_id;
  end if;

  if v_phone is not null then
    insert into contact_identities(tenant_id, contact_id, type, value)
    values (app.current_tenant_id(), v_contact, 'phone', v_phone)
    on conflict (tenant_id, type, value) do update
      set contact_id = excluded.contact_id;
  end if;

  return jsonb_build_object('contact_id', v_contact, 'changed', v_changed);
end;
$$;