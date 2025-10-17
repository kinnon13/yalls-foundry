-- Fix cart_get to handle authenticated vs guest sessions properly
CREATE OR REPLACE FUNCTION public.cart_get(p_session_id text DEFAULT NULL)
RETURNS TABLE(cart_id uuid, item_id uuid, listing_id uuid, qty integer, price_cents integer, variant jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
begin
  -- If user is authenticated, ignore session_id and use auth.uid()
  if auth.uid() is not null then
    return query
    select c.id, i.id, i.listing_id, i.qty, i.price_cents, i.variant
    from shopping_carts c
    join shopping_cart_items i on i.cart_id = c.id
    where c.user_id = auth.uid();
  -- Otherwise use session_id for guest cart
  elsif p_session_id is not null then
    return query
    select c.id, i.id, i.listing_id, i.qty, i.price_cents, i.variant
    from shopping_carts c
    join shopping_cart_items i on i.cart_id = c.id
    where c.session_id = p_session_id;
  end if;
end $function$;

-- Fix cart_upsert_item similarly
CREATE OR REPLACE FUNCTION public.cart_upsert_item(
  p_listing_id uuid, 
  p_qty integer, 
  p_variant jsonb DEFAULT '{}'::jsonb,
  p_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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

  -- Get or create cart (prioritize auth.uid() over session)
  if auth.uid() is not null then
    select id into v_cart_id from shopping_carts where user_id = auth.uid() limit 1;
    if v_cart_id is null then
      insert into shopping_carts (user_id) values (auth.uid()) returning id into v_cart_id;
    end if;
  elsif p_session_id is not null then
    select id into v_cart_id from shopping_carts where session_id = p_session_id limit 1;
    if v_cart_id is null then
      insert into shopping_carts (session_id) values (p_session_id) returning id into v_cart_id;
    end if;
  else
    raise exception 'No auth or session provided';
  end if;

  -- Upsert item
  insert into shopping_cart_items (cart_id, listing_id, qty, price_cents, variant)
  values (v_cart_id, p_listing_id, p_qty, v_price_cents, coalesce(p_variant, '{}'::jsonb))
  on conflict on constraint shopping_cart_items_uniq
  do update set qty = shopping_cart_items.qty + excluded.qty,
                price_cents = excluded.price_cents;

  return v_cart_id;
end $function$;