-- Add helper RPC for atomic inventory decrement
CREATE OR REPLACE FUNCTION public.decrement_listing_stock(
  p_listing_id UUID,
  p_qty INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE marketplace_listings
  SET stock_quantity = GREATEST(0, stock_quantity - p_qty)
  WHERE id = p_listing_id;
END;
$$;