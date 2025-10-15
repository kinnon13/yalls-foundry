-- ========================================
-- External ID + Outbox for Event Publishing
-- ========================================

-- Ensure helper exists
create schema if not exists app;

create or replace function app.current_tenant_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'tenant_id','')::uuid
$$;

-- Ensure external_id uniqueness in contact_identities
create unique index if not exists uniq_contact_identity_external
  on public.contact_identities(tenant_id, type, value)
  where type = 'external_id';

-- Outbox for event publishing (tenant-scoped, Kafka-ready)
create table if not exists public.outbox (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null default app.current_tenant_id(),
  topic        text not null,                      -- e.g. 'contact.updated.v1'
  payload      jsonb not null,
  created_at   timestamptz not null default now(),
  delivered_at timestamptz,
  attempts     int not null default 0
);

alter table public.outbox enable row level security;

drop policy if exists "Tenant isolation for outbox" on public.outbox;
create policy "Tenant isolation for outbox"
  on public.outbox
  for all
  using (tenant_id = app.current_tenant_id())
  with check (tenant_id = app.current_tenant_id());

-- Index for efficient polling of undelivered messages
create index if not exists idx_outbox_undelivered
  on public.outbox(tenant_id, delivered_at, created_at)
  where delivered_at is null;

comment on table public.outbox is 
  'Event outbox for reliable message delivery to Kafka/Redpanda';