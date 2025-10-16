-- Drop and recreate order_start_from_cart with correct signature
DROP FUNCTION IF EXISTS order_start_from_cart(UUID, TEXT);

CREATE OR REPLACE FUNCTION order_start_from_cart(
  p_cart_id UUID,
  p_idempotency_key TEXT
)
RETURNS TABLE(order_id UUID, stripe_payment_intent_id TEXT) AS $$
DECLARE
  v_order_id UUID;
  v_subtotal INT := 0;
  v_email TEXT;
BEGIN
  -- Check idempotency
  IF EXISTS (SELECT 1 FROM idempotency_keys WHERE key = p_idempotency_key) THEN
    RAISE EXCEPTION 'Duplicate request';
  END IF;

  INSERT INTO idempotency_keys (key, scope) VALUES (p_idempotency_key, 'order_start');

  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  -- Validate all items and recalculate prices
  SELECT SUM(
    (SELECT price_cents FROM marketplace_listings WHERE id = sci.listing_id AND status = 'active') * sci.qty
  )
  INTO v_subtotal
  FROM shopping_cart_items sci
  WHERE sci.cart_id = p_cart_id;

  IF v_subtotal IS NULL THEN
    RAISE EXCEPTION 'Cart contains invalid items';
  END IF;

  -- Create order
  INSERT INTO orders (user_id, cart_id, subtotal_cents, tax_cents, shipping_cents, total_cents, email, status, currency)
  VALUES (auth.uid(), p_cart_id, v_subtotal, 0, 0, v_subtotal, v_email, 'created', 'usd')
  RETURNING id INTO v_order_id;

  -- Copy cart items to order
  INSERT INTO order_line_items (order_id, listing_id, qty, unit_price_cents, variant)
  SELECT v_order_id, listing_id, qty, price_cents, variant
  FROM shopping_cart_items
  WHERE cart_id = p_cart_id;

  RETURN QUERY SELECT v_order_id, NULL::TEXT;
END
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;