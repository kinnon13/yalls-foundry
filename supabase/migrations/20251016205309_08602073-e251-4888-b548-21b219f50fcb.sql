-- Module 4: Commerce - Cart & Checkout Schema

-- Shopping carts (user or guest session)
create table if not exists public.shopping_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or session_id is not null)
);

create index if not exists shopping_carts_user_id_idx on public.shopping_carts(user_id);
create index if not exists shopping_carts_session_id_idx on public.shopping_carts(session_id);

-- Cart items
create table if not exists public.shopping_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.shopping_carts(id) on delete cascade,
  listing_id uuid not null,
  qty integer not null check (qty > 0),
  price_cents integer not null,
  variant jsonb,
  created_at timestamptz not null default now(),
  unique(cart_id, listing_id, variant)
);

create index if not exists shopping_cart_items_cart_id_idx on public.shopping_cart_items(cart_id);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  cart_id uuid references public.shopping_carts(id) on delete set null,
  status text not null default 'created' check (status in ('created','paying','paid','failed','refunded','cancelled')),
  currency text not null default 'USD',
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null default 0,
  email text not null,
  shipping_address jsonb,
  payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_payment_intent_id_idx on public.orders(payment_intent_id);
create index if not exists orders_status_idx on public.orders(status);

-- Order line items
create table if not exists public.order_line_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid not null,
  qty integer not null,
  unit_price_cents integer not null,
  variant jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_line_items_order_id_idx on public.order_line_items(order_id);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'stripe',
  intent_id text not null,
  amount_cents integer not null,
  status text not null,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_intent_id_idx on public.payments(intent_id);

-- Ledger entries
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  type text not null,
  amount_cents integer not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_order_id_idx on public.ledger_entries(order_id);

-- Idempotency keys
create table if not exists public.idempotency_keys (
  key text primary key,
  scope text not null,
  created_at timestamptz not null default now()
);

-- RLS Policies

-- Shopping carts
alter table public.shopping_carts enable row level security;

create policy "Users can manage their carts"
on public.shopping_carts for all
using (
  user_id = auth.uid() 
  or session_id = coalesce(
    current_setting('request.jwt.claims', true)::jsonb->>'session_id',
    ''
  )
)
with check (
  user_id = auth.uid() 
  or session_id = coalesce(
    current_setting('request.jwt.claims', true)::jsonb->>'session_id',
    ''
  )
);

-- Shopping cart items
alter table public.shopping_cart_items enable row level security;

create policy "Users can manage their cart items"
on public.shopping_cart_items for all
using (
  exists (
    select 1 from public.shopping_carts
    where id = cart_id
    and (
      user_id = auth.uid()
      or session_id = coalesce(
        current_setting('request.jwt.claims', true)::jsonb->>'session_id',
        ''
      )
    )
  )
)
with check (
  exists (
    select 1 from public.shopping_carts
    where id = cart_id
    and (
      user_id = auth.uid()
      or session_id = coalesce(
        current_setting('request.jwt.claims', true)::jsonb->>'session_id',
        ''
      )
    )
  )
);

-- Orders
alter table public.orders enable row level security;

create policy "Users can view their orders"
on public.orders for select
using (user_id = auth.uid() or is_admin(auth.uid()));

create policy "System can manage orders"
on public.orders for all
using (true)
with check (true);

-- Order line items
alter table public.order_line_items enable row level security;

create policy "Users can view their order items"
on public.order_line_items for select
using (
  exists (
    select 1 from public.orders
    where id = order_id
    and (user_id = auth.uid() or is_admin(auth.uid()))
  )
);

-- Payments
alter table public.payments enable row level security;

create policy "Users can view their payments"
on public.payments for select
using (
  exists (
    select 1 from public.orders
    where id = order_id
    and (user_id = auth.uid() or is_admin(auth.uid()))
  )
);

-- Ledger entries
alter table public.ledger_entries enable row level security;

create policy "Admins can view ledger"
on public.ledger_entries for select
using (is_admin(auth.uid()));

-- Cart RPCs

-- Get or create cart for user/session
create or replace function public.cart_upsert_item(
  p_listing_id uuid,
  p_qty int,
  p_session_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
  v_price_cents int;
begin
  -- Get or create cart
  select id into v_cart_id
  from shopping_carts
  where (user_id = auth.uid() and auth.uid() is not null)
     or (session_id = p_session_id and p_session_id is not null)
  limit 1;

  if v_cart_id is null then
    insert into shopping_carts (user_id, session_id)
    values (auth.uid(), p_session_id)
    returning id into v_cart_id;
  end if;

  -- Get listing price (stub - adjust based on your marketplace schema)
  v_price_cents := 1000; -- placeholder

  -- Upsert cart item
  insert into shopping_cart_items (cart_id, listing_id, qty, price_cents)
  values (v_cart_id, p_listing_id, p_qty, v_price_cents)
  on conflict (cart_id, listing_id, variant)
  do update set qty = shopping_cart_items.qty + p_qty,
                price_cents = v_price_cents;

  return v_cart_id;
end
$$;

-- Get cart with items
create or replace function public.cart_get(p_session_id text default null)
returns table(
  cart_id uuid,
  item_id uuid,
  listing_id uuid,
  qty int,
  price_cents int,
  variant jsonb
)
language sql
security definer
set search_path = public
as $$
  select 
    c.id as cart_id,
    i.id as item_id,
    i.listing_id,
    i.qty,
    i.price_cents,
    i.variant
  from shopping_carts c
  join shopping_cart_items i on i.cart_id = c.id
  where (c.user_id = auth.uid() and auth.uid() is not null)
     or (c.session_id = p_session_id and p_session_id is not null);
$$;

-- Merge guest cart to user on login
create or replace function public.cart_merge_guest_to_user(p_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_cart_id uuid;
  v_user_cart_id uuid;
begin
  -- Find guest cart
  select id into v_guest_cart_id
  from shopping_carts
  where session_id = p_session_id
  limit 1;

  if v_guest_cart_id is null then
    return;
  end if;

  -- Find or create user cart
  select id into v_user_cart_id
  from shopping_carts
  where user_id = auth.uid()
  limit 1;

  if v_user_cart_id is null then
    insert into shopping_carts (user_id)
    values (auth.uid())
    returning id into v_user_cart_id;
  end if;

  -- Move items
  update shopping_cart_items
  set cart_id = v_user_cart_id
  where cart_id = v_guest_cart_id;

  -- Delete guest cart
  delete from shopping_carts where id = v_guest_cart_id;
end
$$;

-- Start order from cart
create or replace function public.order_start_from_cart(
  p_cart_id uuid,
  p_idempotency_key text
)
returns table(order_id uuid, client_secret text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal int := 0;
  v_email text;
begin
  -- Check idempotency
  if exists (select 1 from idempotency_keys where key = p_idempotency_key) then
    raise exception 'Duplicate request';
  end if;

  insert into idempotency_keys (key, scope) values (p_idempotency_key, 'order_start');

  -- Get user email
  select email into v_email from auth.users where id = auth.uid();

  -- Calculate subtotal
  select sum(qty * price_cents) into v_subtotal
  from shopping_cart_items
  where cart_id = p_cart_id;

  -- Create order
  insert into orders (user_id, cart_id, subtotal_cents, total_cents, email, status)
  values (auth.uid(), p_cart_id, v_subtotal, v_subtotal, v_email, 'created')
  returning id into v_order_id;

  -- Copy cart items to order
  insert into order_line_items (order_id, listing_id, qty, unit_price_cents, variant)
  select v_order_id, listing_id, qty, price_cents, variant
  from shopping_cart_items
  where cart_id = p_cart_id;

  -- Return order info (client_secret would come from Stripe in real impl)
  return query select v_order_id, 'stripe_client_secret_placeholder'::text;
end
$$;