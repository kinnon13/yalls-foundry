-- Add reversal tracking to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS reversed_at timestamptz,
ADD COLUMN IF NOT EXISTS reversal_reason text;

-- Update commission release logic to require label printing
CREATE OR REPLACE FUNCTION commission_check_release()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released_count int;
BEGIN
  -- Release commissions where:
  -- 1. Status is 'hold'
  -- 2. Label was printed AND 14 days have passed since label print
  WITH released AS (
    UPDATE commission_ledger cl
    SET status = 'payable'
    FROM orders o
    WHERE cl.order_id = o.id
      AND cl.status = 'hold'
      AND o.label_printed_at IS NOT NULL
      AND o.label_printed_at < now() - interval '14 days'
      AND o.reversed_at IS NULL
    RETURNING 1
  )
  SELECT count(*) INTO v_released_count FROM released;

  RETURN v_released_count;
END;
$$;

-- Auto-reverse orders without labels after 7 days
CREATE OR REPLACE FUNCTION order_reverse_unlabeled()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reversed_count int := 0;
  v_order RECORD;
  v_platform_id uuid;
BEGIN
  -- Get platform account
  SELECT party_id INTO v_platform_id
  FROM affiliate_nodes
  WHERE party_kind = 'user'
  ORDER BY attached_at
  LIMIT 1;

  -- Find orders paid but no label within 7 days
  FOR v_order IN
    SELECT id, total_cents, user_id
    FROM orders
    WHERE status = 'paid'
      AND label_printed_at IS NULL
      AND mock_paid_at < now() - interval '7 days'
      AND reversed_at IS NULL
  LOOP
    -- Reverse the order
    UPDATE orders
    SET status = 'reversed',
        reversed_at = now(),
        reversal_reason = 'No shipping label printed within 7 days'
    WHERE id = v_order.id;

    -- Cancel all commissions for this order (except buyer's 4% which business keeps)
    UPDATE commission_ledger
    SET status = 'reversed'
    WHERE order_id = v_order.id
      AND commission_type != 'platform_buyer_upline';

    -- Platform keeps the buyer's 4% (already in ledger)
    -- Business loses their net amount (handled externally via payment processor)

    v_reversed_count := v_reversed_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'reversed_count', v_reversed_count,
    'success', true
  );
END;
$$;

-- Update commission distribution to note label requirement
COMMENT ON FUNCTION commission_distribute_dual_tree IS 
'Distributes commissions with 14-day hold. Commissions only release after label is printed + 14 days. Orders auto-reverse if no label within 7 days.';