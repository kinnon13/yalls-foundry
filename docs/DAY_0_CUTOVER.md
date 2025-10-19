# Day-0 Cutover Guide

## Pre-Flight Checklist

- [ ] All migrations applied and verified
- [ ] Feature flags table populated
- [ ] Seed data loaded (interests, categories, candidates)
- [ ] Edge functions deployed
- [ ] Cron jobs configured
- [ ] Secrets rotated and secured

## 1. Deployment Order (Idempotent)

### A. Database Migrations
All migrations are idempotent and safe to re-run:

```bash
# Migrations are auto-applied via Lovable Cloud
# Verify completion:
psql "$DATABASE_URL" -c "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"
```

### B. Feature Flags Bootstrap

```sql
-- Flags are already seeded, verify:
SELECT key, value FROM public.feature_flags ORDER BY key;
```

Expected output:
- `global.safe_mode` → `{"enabled": false}`
- `ranker.policy` → `{"version":"epsilon_greedy_v1","epsilon":0.08}`
- `marketplace.suggest` → `{"enabled": true}`
- `learning.enabled` → `{"enabled": true}`
- `crush_mode.enabled` → `{"enabled": false}`

### C. Edge Functions

Deploy order (via Supabase CLI or auto-deploy):
1. `hydrate-features` - Feature store hydration
2. `queue-worker` - Generic lease/ack/fail worker
3. `rocker-discovery-run` - Discovery queue processor
4. `policy-ranker` - Ranking policy (epsilon-greedy)

```bash
# Verify deployment
curl -s "$SUPABASE_URL/functions/v1/health" | jq
```

### D. Cron Jobs

Configure in Supabase dashboard or via `supabase/config.toml`:

```toml
[functions.queue-worker.cron]
schedule = "* * * * *"  # Every minute

[functions.rocker-discovery-run.cron]
schedule = "*/5 * * * *"  # Every 5 minutes

[functions.gc-learning-events.cron]
schedule = "0 2 * * *"  # Daily at 2 AM

[functions.gc-intent-signals.cron]
schedule = "0 3 * * *"  # Daily at 3 AM
```

### E. Secrets Rotation

```bash
# Generate new service role key
supabase projects api-keys --project-ref xuxfuonzsfvrirdwzddt

# Update in secrets manager
# Store: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, REDIS_URL
```

## 2. 15-Minute Smoke Test

### A. Schema & RLS Verification

```sql
-- Critical tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
AND table_name IN (
  'learning_events',
  'rate_limits',
  'marketplace_discovery_queue',
  'events_queue',
  'feature_flags'
)
ORDER BY table_name;
```

**Expected:** 5 rows

```sql
-- RLS policies exist
SELECT relname, polname
FROM pg_policies
WHERE schemaname='public'
AND relname IN (
  'user_interests',
  'intent_signals',
  'marketplace_discovery_queue',
  'learning_events',
  'rate_limits'
)
ORDER BY relname, polname;
```

**Expected:** Multiple rows showing policies for each table

### B. Queue Health

```sql
-- Discovery queue (empty OK at t0)
SELECT * FROM public.vw_discovery_queue_health;

-- Dead letter queue (should be empty)
SELECT * FROM public.vw_dead_letter_queue LIMIT 5;

-- Events queue health (empty OK at t0)
SELECT * FROM public.vw_events_queue_health;
```

### C. Learning System Alive

```sql
-- Policy health (empty OK at t0, will populate after first decisions)
SELECT * FROM public.vw_policy_health;

-- SLO burn-rate (empty OK at t0)
SELECT * FROM public.vw_slo_burnrate;

-- Kernel SLOs (will populate as users interact)
SELECT * FROM public.vw_kernel_slos;
```

### D. Seed Data Verification

```sql
-- Interests seeded (should show 6)
SELECT COUNT(*) AS interest_count FROM public.interest_catalog;

-- Categories seeded (should show 6)
SELECT COUNT(*) AS category_count FROM public.marketplace_categories;

-- Mappings seeded (should show 6)
SELECT COUNT(*) AS mapping_count FROM public.marketplace_interest_map;

-- Candidates seeded (should show 6)
SELECT COUNT(*) AS candidate_count FROM public.marketplace_candidates;
```

### E. Simulate User Journey

```sql
-- Example: use a real test user UUID from your database
-- First, get a test user:
SELECT id, email FROM auth.users LIMIT 1;
-- Copy the UUID and replace TEST_USER below

\set TEST_USER '00000000-0000-0000-0000-000000000001'

-- Set 3 interests for the user
INSERT INTO public.user_interests(user_id, interest_id, affinity)
VALUES
  (:'TEST_USER'::uuid, '11111111-1111-1111-1111-111111111111', 0.9),
  (:'TEST_USER'::uuid, '22222222-2222-2222-2222-222222222222', 0.8),
  (:'TEST_USER'::uuid, '33333333-3333-3333-3333-333333333333', 0.7)
ON CONFLICT (user_id, interest_id) DO UPDATE SET affinity = EXCLUDED.affinity;

-- Ensure category and enqueue discovery
SELECT public.ensure_category_for_interest('11111111-1111-1111-1111-111111111111'::uuid);
SELECT public.enqueue_discovery_for_user(:'TEST_USER'::uuid);

-- Verify queue populated
SELECT * FROM public.marketplace_discovery_queue
WHERE interest_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);
```

### F. Run Worker Once (HTTP)

```bash
# Queue worker (leases & processes)
curl -s -X POST "$SUPABASE_URL/functions/v1/queue-worker" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{"topic":"discovery.user-signup","limit":20,"ttl":120}' | jq
```

**Expected:** JSON response with `{"processed": N, "errors": 0}`

### G. Verify Worker Effects

```sql
-- Queue health should show processing/done items
SELECT * FROM public.vw_discovery_queue_health;

-- Gaps may be populated (depends on discovery logic)
SELECT * FROM public.marketplace_gaps LIMIT 10;

-- Suggestions smoke test
SELECT * FROM public.marketplace_suggestions_for_user(:'TEST_USER'::uuid, 12);
```

**Expected:** At least a few marketplace suggestions returned

### H. Learning Heartbeat

```sql
-- Emit a test learning event
INSERT INTO public.learning_events(
  user_id, surface, candidate_id, policy, p_exp, score, explored, reward, context
)
VALUES(
  :'TEST_USER'::uuid,
  'feed',
  'post_abc',
  'epsilon_greedy_v1',
  0.08,
  0.42,
  false,
  0.6,
  '{}'::jsonb
);

-- Verify policy health
SELECT * FROM public.vw_policy_health;
```

**Expected:** One row showing policy stats with non-null values

## 3. Abort Switch (Emergency Safe Mode)

If SLOs spike, learning goes haywire, or you detect issues:

```sql
-- Enable safe mode (disables exploration, uses deterministic slates)
UPDATE public.feature_flags
SET value = '{"enabled": true}'::jsonb, updated_at = now()
WHERE key = 'global.safe_mode';
```

**Ranker behavior in safe mode:**
- Epsilon → 0 (pure exploit, no exploration)
- Fallback to: popular + recent + global slates
- No propensity logging (p_exp = 0)

To disable safe mode:

```sql
UPDATE public.feature_flags
SET value = '{"enabled": false}'::jsonb, updated_at = now()
WHERE key = 'global.safe_mode';
```

## 4. Monitoring & Alerts

### Key Metrics to Watch

```sql
-- Discovery queue backlog (alert if p95 > 300s)
SELECT p95_age_sec FROM public.vw_discovery_queue_health WHERE status = 'queued';

-- Kernel SLOs (alert if p95 > 600ms for auth.login)
SELECT * FROM public.vw_kernel_slos;

-- Burn-rate (alert if > 2.0 on any path)
SELECT * FROM public.vw_slo_burnrate;

-- Policy health (alert if exploration_rate deviates > ±50% from epsilon)
SELECT * FROM public.vw_policy_health;
```

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| `vw_discovery_queue_health.p95_age_sec` | > 300s | Scale worker concurrency |
| `vw_kernel_slos.p95_ms` (auth.login) | > 600ms | Check DB connections |
| `vw_slo_burnrate.burn_rate` | > 2.0 | Enable safe mode |
| `vw_policy_health.exploration_rate` | > ε ± 50% | Review bandit config |
| 5xx error rate | > 1% | Rollback deployment |

## 5. Canary Rollout

### Phase 1: Internal Testing (1 day)
- 100% safe mode enabled
- Manually test all user flows
- Verify SLOs are green

### Phase 2: 5% Canary (2 days)
- Disable safe mode for 5% of users
- Monitor metrics hourly
- Auto-rollback if any threshold breached

### Phase 3: 25% Rollout (3 days)
- Expand to 25% if Phase 2 stable
- Continue monitoring

### Phase 4: 100% General Availability
- Full rollout after 25% stable for 3 days

## 6. Rollback Procedure

If issues detected:

```bash
# 1. Enable safe mode immediately
psql "$DATABASE_URL" -c "UPDATE public.feature_flags SET value = '{\"enabled\": true}'::jsonb WHERE key = 'global.safe_mode';"

# 2. Scale down workers
# (via Supabase dashboard or CLI)

# 3. Review logs
supabase functions logs rocker-discovery-run --limit 100

# 4. Identify issue
# Check: vw_discovery_queue_health, vw_policy_health, postgres logs

# 5. Fix and redeploy
# Apply hotfix migration or code change

# 6. Disable safe mode after verification
psql "$DATABASE_URL" -c "UPDATE public.feature_flags SET value = '{\"enabled\": false}'::jsonb WHERE key = 'global.safe_mode';"
```

## 7. Day-2 Operations

### Daily Checks (5 minutes)

```bash
# Health check
curl -s "$SUPABASE_URL/functions/v1/health" | jq

# Queue health
psql "$DATABASE_URL" -c "SELECT * FROM public.vw_discovery_queue_health;"

# Policy health
psql "$DATABASE_URL" -c "SELECT * FROM public.vw_policy_health;"
```

### Weekly Tasks
- Review SLO trends
- Check for DLQ items (dead letter queue)
- Analyze learning_events for outliers
- Rotate secrets

### Monthly Tasks
- Review and prune old learning_events (GC runs daily, verify)
- Analyze policy performance (IPS/DR metrics)
- Update interest catalog with new categories
- Review and update feature flags

## 8. Troubleshooting

### Queue Stuck (High p95_age_sec)

```sql
-- Check for stuck leases
SELECT * FROM public.marketplace_discovery_queue
WHERE status = 'processing' AND lease_expires_at < now();

-- Requeue stuck items
UPDATE public.marketplace_discovery_queue
SET status = 'queued', lease_token = NULL, lease_expires_at = NULL
WHERE status = 'processing' AND lease_expires_at < now();
```

### Learning Not Recording

```sql
-- Check if learning is enabled
SELECT * FROM public.feature_flags WHERE key = 'learning.enabled';

-- Check recent learning events
SELECT * FROM public.learning_events ORDER BY ts DESC LIMIT 10;

-- Verify RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'learning_events';
```

### Suggestions Empty

```sql
-- Check if user has interests (replace with actual UUID)
SELECT * FROM public.user_interests WHERE user_id = :'TEST_USER'::uuid;

-- Check if categories mapped
SELECT ic.name, mc.name
FROM public.interest_catalog ic
JOIN public.marketplace_interest_map mim ON mim.interest_id = ic.id
JOIN public.marketplace_categories mc ON mc.id = mim.category_id;

-- Check if candidates exist
SELECT * FROM public.marketplace_candidates LIMIT 10;
```

## 9. Success Criteria

- [ ] All smoke tests pass
- [ ] Queue p95_age_sec < 300s
- [ ] SLOs green (p95 < 600ms)
- [ ] Learning events populating
- [ ] Suggestions returning results
- [ ] No errors in worker logs
- [ ] Feature flags responsive
- [ ] Safe mode toggle works
- [ ] Alerts firing correctly
- [ ] Canary metrics stable

## 10. Support Contacts

- **On-Call Engineer:** [Contact Info]
- **Database Admin:** [Contact Info]
- **DevOps Lead:** [Contact Info]
- **Product Owner:** [Contact Info]

## Appendix: SQL Quick Reference

```sql
-- Requeue all stuck items
UPDATE public.marketplace_discovery_queue
SET status = 'queued', lease_token = NULL, lease_expires_at = NULL
WHERE status = 'processing' AND lease_expires_at < now();

-- Clear DLQ (after manual review)
DELETE FROM public.marketplace_discovery_queue WHERE status = 'error';

-- Force GC (manual cleanup)
SELECT public.gc_learning_events();
SELECT public.gc_intent_signals();

-- Toggle safe mode
UPDATE public.feature_flags SET value = '{"enabled": true}'::jsonb WHERE key = 'global.safe_mode';
UPDATE public.feature_flags SET value = '{"enabled": false}'::jsonb WHERE key = 'global.safe_mode';

-- View recent actions
SELECT * FROM public.ai_action_ledger ORDER BY timestamp DESC LIMIT 20;
```
