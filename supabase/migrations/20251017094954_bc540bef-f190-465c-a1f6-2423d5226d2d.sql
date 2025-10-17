-- PR2.9: Revenue v1 (Promotions + Pricing + DemandGen)

-- === PROMOTIONS ===
create type promotion_kind as enum ('discount', 'boost');
create type discount_type as enum ('percent', 'amount');

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind promotion_kind not null default 'discount',
  discount_type discount_type,
  discount_value numeric not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','active','ended','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_targets (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  unique(promotion_id, listing_id)
);

create table if not exists public.promotion_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  amount_cents int not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_promotions_owner on public.promotions(owner_user_id);
create index if not exists idx_promotions_active on public.promotions(status, start_at, end_at);
create index if not exists idx_promotion_targets_promo on public.promotion_targets(promotion_id);
create index if not exists idx_promotion_redemptions_promo on public.promotion_redemptions(promotion_id);

alter table public.promotions enable row level security;
alter table public.promotion_targets enable row level security;
alter table public.promotion_redemptions enable row level security;

create policy promotions_owner_all on public.promotions for all using (auth.uid() = owner_user_id);
create policy promotion_targets_owner on public.promotion_targets for all using (
  exists (select 1 from public.promotions where id = promotion_id and owner_user_id = auth.uid())
);
create policy promotion_redemptions_owner on public.promotion_redemptions for select using (
  exists (select 1 from public.promotions where id = promotion_id and owner_user_id = auth.uid())
);

-- === PRICING TESTS ===
create table if not exists public.price_tests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','running','ended','cancelled')),
  started_at timestamptz,
  ended_at timestamptz,
  winner_variant text,
  created_at timestamptz not null default now()
);

create table if not exists public.price_test_variants (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.price_tests(id) on delete cascade,
  variant_key text not null check (variant_key in ('A','B','C','D')),
  price_cents int not null,
  unique(test_id, variant_key)
);

create index if not exists idx_price_tests_listing on public.price_tests(listing_id, status);
create index if not exists idx_price_tests_owner on public.price_tests(owner_user_id);

alter table public.price_tests enable row level security;
alter table public.price_test_variants enable row level security;

create policy price_tests_owner_all on public.price_tests for all using (auth.uid() = owner_user_id);
create policy price_test_variants_owner on public.price_test_variants for all using (
  exists (select 1 from public.price_tests where id = test_id and owner_user_id = auth.uid())
);

-- RPCs for pricing
create or replace function public.start_price_test(
  p_listing_id uuid,
  p_variants jsonb -- [{"variant":"A","price_cents":1000}, {"variant":"B","price_cents":1200}]
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_test_id uuid;
  v_variant jsonb;
begin
  -- Create test
  insert into public.price_tests(listing_id, owner_user_id, status, started_at)
  values (p_listing_id, auth.uid(), 'running', now())
  returning id into v_test_id;
  
  -- Insert variants
  for v_variant in select * from jsonb_array_elements(p_variants)
  loop
    insert into public.price_test_variants(test_id, variant_key, price_cents)
    values (v_test_id, v_variant->>'variant', (v_variant->>'price_cents')::int);
  end loop;
  
  return v_test_id;
end$$;

create or replace function public.end_price_test(p_test_id uuid, p_winner text default null)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_test record;
  v_metrics jsonb;
begin
  select * into v_test from public.price_tests where id = p_test_id and owner_user_id = auth.uid();
  if not found then raise exception 'Test not found or unauthorized'; end if;
  
  -- Simple winner logic: if not provided, pick variant with most orders (placeholder)
  if p_winner is null then
    select variant_key into p_winner
    from public.price_test_variants
    where test_id = p_test_id
    limit 1;
  end if;
  
  update public.price_tests
  set status = 'ended', ended_at = now(), winner_variant = p_winner
  where id = p_test_id;
  
  -- Return summary
  select jsonb_build_object(
    'test_id', p_test_id,
    'winner', p_winner,
    'ended_at', now()
  ) into v_metrics;
  
  return v_metrics;
end$$;

create or replace function public.get_price_suggestions(p_listing_id uuid)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_current_price int;
  v_suggestions jsonb;
begin
  select price_cents into v_current_price
  from public.marketplace_listings
  where id = p_listing_id and seller_user_id = auth.uid();
  
  if not found then raise exception 'Listing not found or unauthorized'; end if;
  
  -- Simple heuristic: suggest +/-10% and +/-20%
  select jsonb_build_object(
    'current', v_current_price,
    'suggestions', jsonb_build_array(
      jsonb_build_object('label', '-20%', 'price_cents', round(v_current_price * 0.8)),
      jsonb_build_object('label', '-10%', 'price_cents', round(v_current_price * 0.9)),
      jsonb_build_object('label', '+10%', 'price_cents', round(v_current_price * 1.1)),
      jsonb_build_object('label', '+20%', 'price_cents', round(v_current_price * 1.2))
    )
  ) into v_suggestions;
  
  return v_suggestions;
end$$;

-- === DEMANDGEN CAMPAIGNS ===
create table if not exists public.rocker_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('sms','email','chat')),
  template jsonb not null default '{}'::jsonb, -- {subject, body, variables}
  schedule_at timestamptz,
  rrule text, -- optional recurring rule
  status text not null default 'draft' check (status in ('draft','scheduled','sending','sent','cancelled')),
  sent_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rocker_campaign_audience (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.rocker_campaigns(id) on delete cascade,
  segment text not null check (segment in ('followers','past_buyers','crm_list','all_users')),
  segment_params jsonb not null default '{}'::jsonb,
  user_ids uuid[] -- pre-computed audience
);

create index if not exists idx_campaigns_user on public.rocker_campaigns(user_id, status);
create index if not exists idx_campaign_audience_campaign on public.rocker_campaign_audience(campaign_id);

alter table public.rocker_campaigns enable row level security;
alter table public.rocker_campaign_audience enable row level security;

create policy campaigns_owner_all on public.rocker_campaigns for all using (auth.uid() = user_id);
create policy campaign_audience_owner on public.rocker_campaign_audience for all using (
  exists (select 1 from public.rocker_campaigns where id = campaign_id and user_id = auth.uid())
);

-- RPC to queue campaign messages
create or replace function public.queue_campaign_messages(p_campaign_id uuid)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_campaign record;
  v_audience record;
  v_recipient uuid;
  v_queued int := 0;
  v_body text;
begin
  select * into v_campaign from public.rocker_campaigns
  where id = p_campaign_id and user_id = auth.uid() and status = 'scheduled';
  
  if not found then raise exception 'Campaign not found or not ready'; end if;
  
  select * into v_audience from public.rocker_campaign_audience where campaign_id = p_campaign_id;
  
  -- Queue messages for each recipient
  foreach v_recipient in array coalesce(v_audience.user_ids, '{}'::uuid[])
  loop
    v_body := v_campaign.template->>'body';
    
    -- Get recipient contact
    insert into public.rocker_outbox(user_id, channel, to_addr, subject, body, payload)
    select v_recipient, v_campaign.channel::rocker_msg_channel,
           case v_campaign.channel
             when 'sms' then (select phone from user_contacts where user_id = v_recipient)
             when 'email' then (select email from user_contacts where user_id = v_recipient)
             else 'in_app'
           end,
           v_campaign.template->>'subject',
           v_body,
           jsonb_build_object('campaign_id', p_campaign_id)
    where exists (select 1 from user_contacts where user_id = v_recipient);
    
    v_queued := v_queued + 1;
  end loop;
  
  update public.rocker_campaigns
  set status = 'sending', sent_count = v_queued, updated_at = now()
  where id = p_campaign_id;
  
  return jsonb_build_object('campaign_id', p_campaign_id, 'queued', v_queued);
end$$;

-- Telemetry event types for revenue features
comment on table public.promotions is 'PR2.9: Discount/boost promotions for listings';
comment on table public.price_tests is 'PR2.9: A/B price testing for listings';
comment on table public.rocker_campaigns is 'PR2.9: DemandGen campaigns (email/SMS/chat)';