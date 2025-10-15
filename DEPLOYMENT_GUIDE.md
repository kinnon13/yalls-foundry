# Deployment Guide: RBAC, Rate Limiting & Idempotency

This guide covers the deployment of three critical security and reliability features:
- **Pack A:** RBAC (Role-Based Access Control)
- **Pack B:** Rate Limiting (Upstash Redis)
- **Pack C:** Idempotency (Prevents duplicate transactions)

## Prerequisites

1. Supabase project connected via Lovable Cloud
2. Upstash Redis account (for rate limiting)
3. Stripe account (for payment idempotency)

## Step 1: Database Setup

The SQL migrations have been applied automatically. Verify they succeeded:

```sql
-- Check RBAC tables
SELECT * FROM public.user_roles LIMIT 5;

-- Check idempotency table
SELECT * FROM public.idempotency_log LIMIT 5;

-- Verify has_role function
SELECT public.has_role(auth.uid(), 'admin');
```

## Step 2: Configure Secrets

Add these environment variables to your Supabase project:

### Required for Rate Limiting:
- `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis token

### Already Configured:
- `OPENAI_API_KEY` - For Rocker AI
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_WEBHOOK_SECRET` - For webhooks

### To add secrets in Lovable Cloud:
1. Go to Settings → Edge Functions
2. Add the environment variables
3. Deploy functions

## Step 3: Seed First Admin

Replace the UUID with your user ID:

```sql
-- Find your user ID
SELECT id, email FROM auth.users 
WHERE email = 'your@email.com';

-- Grant admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-UUID', 'admin')
ON CONFLICT DO NOTHING;
```

## Step 4: Verify Deployment

### Test RBAC:

```sql
-- Should return true for admin
SELECT public.has_role('YOUR-USER-UUID', 'admin');
```

### Test Rate Limiting:

```bash
# Run this 12 times quickly
for i in {1..12}; do 
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer YOUR_JWT" \
    https://YOUR-PROJECT.supabase.co/functions/v1/rocker-chat \
    -d '{"messages":[{"role":"user","content":"hi"}]}'
done
# Last 2 requests should return 429
```

### Test Idempotency:

```bash
# Call checkout twice with same cart
CART='[{"listing":{"id":"123","price_cents":1000},"quantity":1}]'

# First call
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"cartItems\":$CART}"

# Second call (should return cached:true with same orderId)
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"cartItems\":$CART}"
```

## Rate Limits by Function

| Function | Limit | Window | User Type |
|----------|-------|--------|-----------|
| rocker-chat | 10 | 60s | All |
| upload-media | 5 | 60s | All |
| create-checkout-session | 3 | 60s | All |

## Idempotency Coverage

| Operation | Protection | Key Based On |
|-----------|-----------|--------------|
| Checkout | Redis + DB | user_id + cart_hash |
| Commission Ledger | DB constraint | session_id + recipient_id |
| Stripe Webhooks | Stripe event.id | event.id |

## Monitoring

### Check Rate Limit Stats (Upstash):
```bash
# Via Upstash CLI or dashboard
redis-cli --url $UPSTASH_REDIS_REST_URL KEYS "ratelimit:*"
```

### Check Idempotency Cache:
```sql
SELECT key, created_at, expires_at 
FROM public.idempotency_log 
ORDER BY created_at DESC 
LIMIT 10;
```

### Cleanup Expired Records:
```sql
SELECT public.cleanup_expired_idempotency();
```

## Troubleshooting

### Rate Limiting Not Working:
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check Redis connection: Test with Upstash dashboard
- If Redis fails, functions will "fail open" (allow requests)

### RBAC Not Working:
- Verify user has role: `SELECT * FROM user_roles WHERE user_id = 'UUID';`
- Check function exists: `SELECT proname FROM pg_proc WHERE proname = 'has_role';`
- Test function: `SELECT has_role(auth.uid(), 'admin');`

### Idempotency Not Working:
- Check table exists: `SELECT * FROM idempotency_log LIMIT 1;`
- Verify unique constraint: `\d+ commission_ledger` (should show idem constraint)
- Clear cache if needed: `DELETE FROM idempotency_log WHERE key LIKE 'checkout:%';`

## Production Checklist

- [ ] All secrets configured in Supabase dashboard
- [ ] At least one admin user seeded
- [ ] Redis connection tested
- [ ] Rate limits tested (429 responses work)
- [ ] Idempotency tested (duplicate calls return cached results)
- [ ] Monitoring dashboard set up (Upstash + Supabase logs)
- [ ] Alert thresholds configured (rate limit hits, auth failures)

## Next Steps

Optional enhancements:
1. Add AI cost tracking to `rocker-chat`
2. Implement admin dashboard for user role management
3. Add Stripe webhook idempotency handling
4. Set up automatic cleanup job for expired idempotency records

## Support

For issues:
1. Check Supabase function logs
2. Check Upstash Redis dashboard
3. Review console logs in browser DevTools
4. Contact support if persistent issues
