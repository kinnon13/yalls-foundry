-- Add creator account flag to profiles (required to receive payouts)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS creator_account_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS creator_account_verified_at timestamptz;

-- Add expiration to commissions (1 year from creation)
ALTER TABLE commission_ledger
ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '1 year'),
ADD COLUMN IF NOT EXISTS redirected_to_platform boolean DEFAULT false;

-- Update commission distribution to handle caps + creator requirements + expiration
CREATE OR REPLACE FUNCTION commission_distribute_dual_tree(
  p_order_id uuid,
  p_rule_set text DEFAULT 'default_v1',
  p_hold_days int DEFAULT 14
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_listing RECORD;
  v_platform_fee numeric(12,2);
  v_buyer_upline_pool numeric(12,2);
  v_seller_upline_pool numeric(12,2);
  v_seller_upline_capped numeric(12,2);
  v_platform_redirect numeric(12,2) := 0;
  v_bonus_total numeric(12,2);
  v_affiliate_direct numeric(12,2);
  v_platform_bonus numeric(12,2);
  v_affiliate_upline_pool numeric(12,2);
  v_chain RECORD;
  v_total_weight numeric := 15.0; -- 10 + 3 + 2
  v_pct numeric(6,3);
  v_amount numeric(12,2);
  v_hold_until timestamptz := now() + (p_hold_days || ' days')::interval;
  v_expires_at timestamptz := now() + interval '1 year';
  v_platform_id uuid;
  v_payee_is_creator boolean;
BEGIN
  -- Get order details
  SELECT o.*, o.total_cents / 100.0 AS total_amount
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- Get listing details for bonus commission
  SELECT ml.*
  INTO v_listing
  FROM marketplace_listings ml
  JOIN order_line_items oli ON oli.listing_id = ml.id
  WHERE oli.order_id = p_order_id
  LIMIT 1;

  -- Get platform account (first admin)
  SELECT party_id INTO v_platform_id
  FROM affiliate_nodes
  WHERE party_kind = 'user'
  ORDER BY attached_at
  LIMIT 1;

  -- ========================================
  -- PLATFORM 8% FEE (4% buyer upline + 4% seller upline)
  -- ========================================
  v_platform_fee := v_order.total_amount * 0.08;
  v_buyer_upline_pool := v_platform_fee * 0.5;  -- 4% (UNCAPPED)
  v_seller_upline_pool := v_platform_fee * 0.5; -- 4% (CAP AT $100)

  -- Apply $100 cap to seller upline pool
  IF v_seller_upline_pool > 100 THEN
    v_platform_redirect := v_seller_upline_pool - 100;
    v_seller_upline_capped := 100;
  ELSE
    v_seller_upline_capped := v_seller_upline_pool;
  END IF;

  -- Distribute 4% to BUYER's upline (UNCAPPED, normalized 10:3:2 ratio)
  FOR v_chain IN
    SELECT level, sponsor_kind, sponsor_id
    FROM get_upline_chain('user', v_order.user_id, 3)
    ORDER BY level
  LOOP
    SELECT pct INTO v_pct
    FROM commission_rules
    WHERE rule_set = p_rule_set AND level = v_chain.level AND active = true;

    IF v_pct IS NULL OR v_pct <= 0 THEN CONTINUE; END IF;

    v_amount := round(v_buyer_upline_pool * (v_pct / v_total_weight), 2);

    -- Check if payee is a creator (only users need creator account; businesses auto-enabled)
    v_payee_is_creator := CASE 
      WHEN v_chain.sponsor_kind = 'business' THEN true
      ELSE COALESCE((SELECT creator_account_enabled FROM profiles WHERE user_id = v_chain.sponsor_id), false)
    END;

    -- If not a creator, redirect to platform
    IF NOT v_payee_is_creator THEN
      INSERT INTO commission_ledger (
        order_id, buyer_kind, buyer_id, seller_kind, seller_id,
        payee_kind, payee_id, level, base_amount, pct_applied, amount,
        status, hold_until, expires_at, rule_set, commission_type, redirected_to_platform
      ) VALUES (
        p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
        'user', v_platform_id, 0,
        v_order.total_amount, v_pct, v_amount,
        'hold', v_hold_until, v_expires_at, p_rule_set, 'platform_buyer_upline', true
      );
    ELSE
      INSERT INTO commission_ledger (
        order_id, buyer_kind, buyer_id, seller_kind, seller_id,
        payee_kind, payee_id, level, base_amount, pct_applied, amount,
        status, hold_until, expires_at, rule_set, commission_type
      ) VALUES (
        p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
        v_chain.sponsor_kind, v_chain.sponsor_id, v_chain.level,
        v_order.total_amount, v_pct, v_amount,
        'hold', v_hold_until, v_expires_at, p_rule_set, 'platform_buyer_upline'
      )
      ON CONFLICT (order_id, payee_kind, payee_id, level) DO NOTHING;
    END IF;
  END LOOP;

  -- Distribute 4% to SELLER's upline (CAPPED AT $100, normalized 10:3:2 ratio)
  FOR v_chain IN
    SELECT level, sponsor_kind, sponsor_id
    FROM get_upline_chain('business', v_listing.entity_id, 3)
    ORDER BY level
  LOOP
    SELECT pct INTO v_pct
    FROM commission_rules
    WHERE rule_set = p_rule_set AND level = v_chain.level AND active = true;

    IF v_pct IS NULL OR v_pct <= 0 THEN CONTINUE; END IF;

    v_amount := round(v_seller_upline_capped * (v_pct / v_total_weight), 2);

    -- Businesses always get paid (no creator account check)
    INSERT INTO commission_ledger (
      order_id, buyer_kind, buyer_id, seller_kind, seller_id,
      payee_kind, payee_id, level, base_amount, pct_applied, amount,
      status, hold_until, expires_at, rule_set, commission_type
    ) VALUES (
      p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
      v_chain.sponsor_kind, v_chain.sponsor_id, v_chain.level,
      v_order.total_amount, v_pct, v_amount,
      'hold', v_hold_until, v_expires_at, p_rule_set, 'platform_seller_upline'
    )
    ON CONFLICT (order_id, payee_kind, payee_id, level) DO NOTHING;
  END LOOP;

  -- Platform gets the cap overage if any
  IF v_platform_redirect > 0 THEN
    INSERT INTO commission_ledger (
      order_id, buyer_kind, buyer_id, seller_kind, seller_id,
      payee_kind, payee_id, level, base_amount, pct_applied, amount,
      status, hold_until, expires_at, rule_set, commission_type, redirected_to_platform
    ) VALUES (
      p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
      'user', v_platform_id, 0,
      v_order.total_amount, 0, v_platform_redirect,
      'payable', now(), now() + interval '10 years', p_rule_set, 'platform_seller_upline', true
    );
  END IF;

  -- ========================================
  -- SELLER BONUS COMMISSION (80/10/10 split)
  -- ========================================
  IF v_listing.bonus_commission_pct > 0 AND v_order.affiliate_referrer_id IS NOT NULL THEN
    v_bonus_total := v_order.total_amount * (v_listing.bonus_commission_pct / 100.0);

    -- Check if affiliate is a creator
    v_payee_is_creator := COALESCE((SELECT creator_account_enabled FROM profiles WHERE user_id = v_order.affiliate_referrer_id), false);

    -- 80% to affiliate who created the post/link (or platform if not creator)
    v_affiliate_direct := round(v_bonus_total * 0.80, 2);
    IF NOT v_payee_is_creator THEN
      INSERT INTO commission_ledger (
        order_id, buyer_kind, buyer_id, seller_kind, seller_id,
        payee_kind, payee_id, level, base_amount, pct_applied, amount,
        status, hold_until, expires_at, rule_set, commission_type, redirected_to_platform
      ) VALUES (
        p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
        'user', v_platform_id, 0,
        v_bonus_total, 80.0, v_affiliate_direct,
        'payable', now(), now() + interval '10 years', p_rule_set, 'bonus_affiliate_direct', true
      );
    ELSE
      INSERT INTO commission_ledger (
        order_id, buyer_kind, buyer_id, seller_kind, seller_id,
        payee_kind, payee_id, level, base_amount, pct_applied, amount,
        status, hold_until, expires_at, rule_set, commission_type
      ) VALUES (
        p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
        'user', v_order.affiliate_referrer_id, 0,
        v_bonus_total, 80.0, v_affiliate_direct,
        'hold', v_hold_until, v_expires_at, p_rule_set, 'bonus_affiliate_direct'
      );
    END IF;

    -- 10% to platform
    v_platform_bonus := round(v_bonus_total * 0.10, 2);
    INSERT INTO commission_ledger (
      order_id, buyer_kind, buyer_id, seller_kind, seller_id,
      payee_kind, payee_id, level, base_amount, pct_applied, amount,
      status, hold_until, expires_at, rule_set, commission_type
    ) VALUES (
      p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
      'user', v_platform_id, 0,
      v_bonus_total, 10.0, v_platform_bonus,
      'payable', now(), now() + interval '10 years', p_rule_set, 'bonus_platform'
    );

    -- 10% to affiliate's upline (split L1/L2/L3)
    v_affiliate_upline_pool := round(v_bonus_total * 0.10, 2);
    FOR v_chain IN
      SELECT level, sponsor_kind, sponsor_id
      FROM get_upline_chain('user', v_order.affiliate_referrer_id, 3)
      ORDER BY level
    LOOP
      SELECT pct INTO v_pct
      FROM commission_rules
      WHERE rule_set = p_rule_set AND level = v_chain.level AND active = true;

      IF v_pct IS NULL OR v_pct <= 0 THEN CONTINUE; END IF;

      v_amount := round(v_affiliate_upline_pool * (v_pct / v_total_weight), 2);

      -- Check if upline payee is creator
      v_payee_is_creator := CASE 
        WHEN v_chain.sponsor_kind = 'business' THEN true
        ELSE COALESCE((SELECT creator_account_enabled FROM profiles WHERE user_id = v_chain.sponsor_id), false)
      END;

      IF NOT v_payee_is_creator THEN
        INSERT INTO commission_ledger (
          order_id, buyer_kind, buyer_id, seller_kind, seller_id,
          payee_kind, payee_id, level, base_amount, pct_applied, amount,
          status, hold_until, expires_at, rule_set, commission_type, redirected_to_platform
        ) VALUES (
          p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
          'user', v_platform_id, 0,
          v_bonus_total, v_pct, v_amount,
          'payable', now(), now() + interval '10 years', p_rule_set, 'bonus_affiliate_upline', true
        );
      ELSE
        INSERT INTO commission_ledger (
          order_id, buyer_kind, buyer_id, seller_kind, seller_id,
          payee_kind, payee_id, level, base_amount, pct_applied, amount,
          status, hold_until, expires_at, rule_set, commission_type
        ) VALUES (
          p_order_id, 'user', v_order.user_id, 'business', v_listing.entity_id,
          v_chain.sponsor_kind, v_chain.sponsor_id, v_chain.level,
          v_bonus_total, v_pct, v_amount,
          'hold', v_hold_until, v_expires_at, p_rule_set, 'bonus_affiliate_upline'
        );
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'platform_fee', v_platform_fee,
    'bonus_total', COALESCE(v_bonus_total, 0),
    'platform_redirect', v_platform_redirect,
    'success', true
  );
END;
$$;

-- Expire old commissions (run nightly via cron)
CREATE OR REPLACE FUNCTION commission_expire_old()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count int;
  v_platform_id uuid;
BEGIN
  SELECT party_id INTO v_platform_id
  FROM affiliate_nodes
  WHERE party_kind = 'user'
  ORDER BY attached_at
  LIMIT 1;

  -- Redirect expired commissions to platform
  WITH expired AS (
    UPDATE commission_ledger
    SET 
      payee_kind = 'user',
      payee_id = v_platform_id,
      status = 'payable',
      redirected_to_platform = true,
      expires_at = now() + interval '10 years'
    WHERE status IN ('hold', 'payable')
      AND expires_at < now()
      AND NOT redirected_to_platform
    RETURNING 1
  )
  SELECT count(*) INTO v_expired_count FROM expired;

  RETURN v_expired_count;
END;
$$;