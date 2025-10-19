-- Function 1: Get user's downline tree (recursive affiliate structure)
CREATE OR REPLACE FUNCTION public.get_my_downline_tree(p_max_depth INT DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  party_kind TEXT,
  party_id UUID,
  depth INT,
  path UUID[],
  total_orders BIGINT,
  total_sales NUMERIC,
  commission_earned NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE downline AS (
    -- Base: direct referrals
    SELECT 
      a.referred_user_id AS user_id,
      'user'::TEXT AS party_kind,
      a.referred_user_id AS party_id,
      1 AS depth,
      ARRAY[auth.uid(), a.referred_user_id] AS path
    FROM affiliate_subscriptions a
    WHERE a.referrer_user_id = auth.uid()
      AND a.status = 'active'
    
    UNION ALL
    
    -- Recursive: next levels
    SELECT 
      a.referred_user_id,
      'user'::TEXT,
      a.referred_user_id,
      d.depth + 1,
      d.path || a.referred_user_id
    FROM affiliate_subscriptions a
    INNER JOIN downline d ON a.referrer_user_id = d.user_id
    WHERE d.depth < p_max_depth
      AND a.status = 'active'
      AND NOT (a.referred_user_id = ANY(d.path)) -- Prevent cycles
  )
  SELECT 
    d.user_id,
    d.party_kind,
    d.party_id,
    d.depth,
    d.path,
    COALESCE(COUNT(DISTINCT o.id), 0)::BIGINT AS total_orders,
    COALESCE(SUM(o.total_cents), 0)::NUMERIC / 100 AS total_sales,
    COALESCE(SUM(cl.amount_cents), 0)::NUMERIC / 100 AS commission_earned
  FROM downline d
  LEFT JOIN orders o ON o.user_id = d.user_id AND o.status NOT IN ('cancelled', 'refunded')
  LEFT JOIN commission_ledger cl ON cl.payee_id = auth.uid() AND cl.payee_kind = 'user' 
    AND cl.source_entity_type = 'order' AND cl.source_entity_id = o.id
  GROUP BY d.user_id, d.party_kind, d.party_id, d.depth, d.path
  ORDER BY d.depth, d.user_id;
END;
$$;

-- Function 2: Get commission summary for current user
CREATE OR REPLACE FUNCTION public.get_my_commission_summary()
RETURNS TABLE(
  total_earned NUMERIC,
  pending NUMERIC,
  payable NUMERIC,
  total_orders BIGINT,
  type_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(cl.amount_cents), 0)::NUMERIC / 100 AS total_earned,
    COALESCE(SUM(CASE WHEN cl.status = 'hold' THEN cl.amount_cents ELSE 0 END), 0)::NUMERIC / 100 AS pending,
    COALESCE(SUM(CASE WHEN cl.status = 'payable' THEN cl.amount_cents ELSE 0 END), 0)::NUMERIC / 100 AS payable,
    COUNT(DISTINCT cl.source_entity_id)::BIGINT AS total_orders,
    COALESCE(
      jsonb_object_agg(
        cl.commission_type, 
        SUM(cl.amount_cents)::NUMERIC / 100
      ) FILTER (WHERE cl.commission_type IS NOT NULL),
      '{}'::JSONB
    ) AS type_breakdown
  FROM commission_ledger cl
  WHERE cl.payee_id = auth.uid() 
    AND cl.payee_kind = 'user';
END;
$$;

-- Function 3: Get downline leaderboard (top performers)
CREATE OR REPLACE FUNCTION public.get_downline_leaderboard(
  p_metric TEXT DEFAULT 'sales',
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  party_kind TEXT,
  party_id UUID,
  display_name TEXT,
  total_orders BIGINT,
  total_sales NUMERIC,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH downline_tree AS (
    SELECT * FROM get_my_downline_tree(10)
  ),
  ranked AS (
    SELECT 
      dt.party_kind,
      dt.party_id,
      COALESCE(p.display_name, 'Unknown User') AS display_name,
      dt.total_orders,
      dt.total_sales,
      CASE 
        WHEN p_metric = 'orders' THEN ROW_NUMBER() OVER (ORDER BY dt.total_orders DESC, dt.total_sales DESC)
        ELSE ROW_NUMBER() OVER (ORDER BY dt.total_sales DESC, dt.total_orders DESC)
      END AS rank
    FROM downline_tree dt
    LEFT JOIN profiles p ON p.user_id = dt.user_id
    WHERE dt.total_orders > 0 OR dt.total_sales > 0
  )
  SELECT 
    ranked.party_kind,
    ranked.party_id,
    ranked.display_name,
    ranked.total_orders,
    ranked.total_sales,
    ranked.rank
  FROM ranked
  ORDER BY ranked.rank
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_my_downline_tree(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_commission_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_downline_leaderboard(TEXT, INT) TO authenticated;