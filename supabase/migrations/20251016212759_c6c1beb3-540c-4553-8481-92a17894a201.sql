-- Fix 1: Tighten RLS policies to use JWT session claim
drop policy if exists "Users can view own cart" on public.shopping_carts;
create policy "Users can view own cart"
on public.shopping_carts for select
using (
  (auth.uid() is not null and user_id = auth.uid())
  or (session_id = coalesce(current_setting('request.jwt.claims', true)::jsonb->>'session_id',''))
);

drop policy if exists "Users can view own cart items" on public.shopping_cart_items;
create policy "Users can view own cart items"
on public.shopping_cart_items for select
using (
  exists (
    select 1 from public.shopping_carts sc
    where sc.id = cart_id
      and (
        (auth.uid() is not null and sc.user_id = auth.uid())
        or (sc.session_id = coalesce(current_setting('request.jwt.claims', true)::jsonb->>'session_id',''))
      )
  )
);

-- Fix 2: Fix unique index to use JSONB directly, not text cast
drop index if exists shopping_cart_items_uniq;
create unique index shopping_cart_items_uniq
on public.shopping_cart_items (cart_id, listing_id, (coalesce(variant, '{}'::jsonb)));

-- Fix 3: Update cart_upsert_item to use ON CONSTRAINT
create or replace function public.cart_upsert_item(
  p_listing_id uuid,
  p_qty int,
  p_session_id text default null
) returns uuid
language plpgsql
security definer set search_path = public as $$
declare
  v_cart_id uuid;
  v_price_cents int;
begin
  -- Validate listing and stock
  select price_cents into v_price_cents
  from marketplace_listings
  where id = p_listing_id and status = 'active' and stock_quantity >= p_qty;

  if v_price_cents is null then
    raise exception 'Listing unavailable or insufficient stock';
  end if;

  -- Get or create cart
  select id into v_cart_id
  from shopping_carts
  where (auth.uid() is not null and user_id = auth.uid())
     or (p_session_id is not null and session_id = p_session_id)
  limit 1;

  if v_cart_id is null then
    insert into shopping_carts (user_id, session_id)
    values (auth.uid(), p_session_id)
    returning id into v_cart_id;
  end if;

  -- Upsert item using constraint name
  insert into shopping_cart_items (cart_id, listing_id, qty, price_cents)
  values (v_cart_id, p_listing_id, p_qty, v_price_cents)
  on conflict on constraint shopping_cart_items_uniq
  do update set qty = shopping_cart_items.qty + excluded.qty,
                price_cents = excluded.price_cents;

  return v_cart_id;
end $$;

-- Fix 4: Add session guards to cart_get
create or replace function public.cart_get(p_session_id text default null)
returns table(
  cart_id uuid, item_id uuid, listing_id uuid, qty int, price_cents int, variant jsonb
) language plpgsql security definer set search_path=public as $$
begin
  -- Guard: verify session matches JWT claim
  if p_session_id is not null and p_session_id <>
     coalesce(current_setting('request.jwt.claims', true)::jsonb->>'session_id','') then
    raise exception 'session mismatch';
  end if;

  return query
  select c.id, i.id, i.listing_id, i.qty, i.price_cents, i.variant
  from shopping_carts c
  join shopping_cart_items i on i.cart_id = c.id
  where (auth.uid() is not null and c.user_id = auth.uid())
     or (p_session_id is not null and c.session_id = p_session_id);
end $$;

-- Fix 5: Add session guard to cart_merge_guest_to_user
create or replace function public.cart_merge_guest_to_user(p_session_id text)
returns void language plpgsql security definer set search_path=public as $$
declare 
  v_guest_cart_id uuid; 
  v_user_cart_id uuid;
begin
  -- Guard: verify session matches JWT claim
  if p_session_id <> coalesce(current_setting('request.jwt.claims', true)::jsonb->>'session_id','') then
    raise exception 'session mismatch';
  end if;

  select id into v_guest_cart_id from shopping_carts where session_id = p_session_id limit 1;
  if v_guest_cart_id is null then return; end if;

  select id into v_user_cart_id from shopping_carts where user_id = auth.uid() limit 1;
  if v_user_cart_id is null then
    insert into shopping_carts (user_id) values (auth.uid()) returning id into v_user_cart_id;
  end if;

  update shopping_cart_items set cart_id = v_user_cart_id where cart_id = v_guest_cart_id;
  delete from shopping_carts where id = v_guest_cart_id;
end $$;

-- Fix 6: Add missing decrement_listing_stock RPC for webhook
create or replace function public.decrement_listing_stock(p_listing_id uuid, p_qty int)
returns void language plpgsql security definer set search_path=public as $$
begin
  update marketplace_listings
  set stock_quantity = stock_quantity - p_qty,
      status = case when stock_quantity - p_qty <= 0 then 'sold' else status end,
      updated_at = now()
  where id = p_listing_id
    and stock_quantity >= p_qty;
  
  if not found then
    raise exception 'Insufficient stock for %', p_listing_id;
  end if;
end $$;