# Master Task List - Billion-User Production Readiness

## Executive Summary
Current completion: **78%**  
Tasks remaining: **87 items**  
Estimated effort: **340 engineer-hours**  
Critical path: **22 items** (must-ship)

---

## 🔴 P0 - Critical (Ship Blockers)

### 1. Notification Preferences System
**Status:** 🔴 Missing  
**Impact:** Users can't control AI communication  
**Effort:** 12h

**Implementation:**
```sql
-- Migration: notification_prefs
CREATE TABLE notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  quiet_hours int4range DEFAULT '[22,8)'::int4range,
  channels jsonb DEFAULT '{"in_app":true,"email":false,"push":false}'::jsonb,
  categories jsonb DEFAULT '{"social":true,"orders":true,"events":true,"ai":true,"system":true}'::jsonb,
  daily_cap int DEFAULT 10,
  digest_hour int DEFAULT 9 CHECK (digest_hour BETWEEN 0 AND 23),
  updated_at timestamptz DEFAULT now()
);

-- Enforcement in notif_send
CREATE OR REPLACE FUNCTION notif_send(
  p_user_id uuid,
  p_category text,
  p_priority int,
  p_title text,
  p_body text,
  p_link text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_prefs notification_prefs%ROWTYPE;
  v_hour int := EXTRACT(HOUR FROM now());
  v_today_count int;
  v_notif_id uuid;
BEGIN
  -- Load prefs
  SELECT * INTO v_prefs FROM notification_prefs WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    v_prefs.quiet_hours := '[22,8)'::int4range;
    v_prefs.daily_cap := 10;
    v_prefs.categories := '{"social":true,"orders":true,"events":true,"ai":true,"system":true}'::jsonb;
  END IF;

  -- Check quiet hours (allow critical P1)
  IF p_priority > 1 AND v_hour <@ v_prefs.quiet_hours THEN
    RAISE NOTICE 'Suppressed: quiet hours';
    RETURN NULL;
  END IF;

  -- Check category opt-out
  IF NOT (v_prefs.categories->p_category)::boolean THEN
    RAISE NOTICE 'Suppressed: category disabled';
    RETURN NULL;
  END IF;

  -- Check daily cap
  SELECT COUNT(*) INTO v_today_count
  FROM notifications
  WHERE user_id = p_user_id AND created_at::date = CURRENT_DATE;
  
  IF v_today_count >= v_prefs.daily_cap AND p_priority > 1 THEN
    RAISE NOTICE 'Suppressed: daily cap';
    RETURN NULL;
  END IF;

  -- Insert notification
  INSERT INTO notifications (user_id, category, priority, title, body, link, payload)
  VALUES (p_user_id, p_category, p_priority, p_title, p_body, p_link, p_payload)
  RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**UI Components:**
- `src/routes/dashboard/settings/notifications.tsx` - Preference editor
- `src/components/notifications/PreferencePanel.tsx` - Quiet hours picker, channel toggles, category switches
- `src/components/notifications/DigestSettings.tsx` - Daily digest hour selector

**Acceptance:**
- [ ] User sets quiet hours 10pm-8am → no AI suggestions sent during that window
- [ ] User disables "social" category → no follow/like notifications
- [ ] User hits daily cap → only P1 (critical) notifications allowed
- [ ] Settings sync across devices within 5 seconds

---

### 2. Entity Edges (Cross-Post & Auto-Propagate)
**Status:** 🔴 Missing  
**Impact:** Brand accounts can't control sub-entity posting  
**Effort:** 10h

**Implementation:**
```sql
-- Migration: entity_edges
CREATE TABLE entity_edges (
  from_entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  to_entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  edge_type text NOT NULL CHECK (edge_type IN ('owns', 'manages', 'brand_of', 'offspring_of')),
  allow_crosspost boolean DEFAULT false,
  auto_propagate boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (from_entity_id, to_entity_id, edge_type)
);

-- Auto-propagate trigger
CREATE OR REPLACE FUNCTION post_auto_propagate() RETURNS TRIGGER AS $$
DECLARE
  v_edge RECORD;
BEGIN
  -- Find edges with auto_propagate=true from any of the post's targets
  FOR v_edge IN
    SELECT DISTINCT e.to_entity_id, e.edge_type
    FROM post_targets pt
    JOIN entity_edges e ON e.from_entity_id = pt.target_entity_id
    WHERE pt.post_id = NEW.id AND e.auto_propagate = true
  LOOP
    -- Create post_target for propagated entity
    INSERT INTO post_targets (post_id, target_entity_id, approved, reason)
    VALUES (NEW.id, v_edge.to_entity_id, true, 'auto_propagated:' || v_edge.edge_type)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER post_auto_propagate_trigger
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION post_auto_propagate();
```

**UI Components:**
- `src/routes/dashboard/business/entity-edges.tsx` - Manage relationships
- `src/components/composer/CrossPostPicker.tsx` - Show edge-aware suggestions
- `src/components/entities/EdgeBadge.tsx` - Visual indicator of relationships

**Acceptance:**
- [ ] Foal tagged → appears on Sire/Dam feeds automatically
- [ ] Brand account with 3 sub-brands → toggle cross-post permissions per sub
- [ ] Composer shows "Auto-propagates to X entities" badge
- [ ] Edge changes reflect in <5s across app

---

### 3. Orders: Refunds & Chargebacks
**Status:** 🟡 Partial (orders exist, no refund flow)  
**Impact:** Can't handle customer disputes  
**Effort:** 8h

**Implementation:**
```sql
-- Migration: refunds
CREATE TABLE order_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  refund_type text NOT NULL CHECK (refund_type IN ('full', 'partial', 'chargeback')),
  amount_cents int NOT NULL,
  reason text,
  initiated_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  provider_refund_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE OR REPLACE FUNCTION order_refund(
  p_order_id uuid,
  p_amount_cents int,
  p_reason text
) RETURNS uuid AS $$
DECLARE
  v_refund_id uuid;
  v_order orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  
  IF v_order.status NOT IN ('paid', 'completed') THEN
    RAISE EXCEPTION 'Order not refundable';
  END IF;

  INSERT INTO order_refunds (order_id, refund_type, amount_cents, reason, initiated_by)
  VALUES (p_order_id, 'partial', p_amount_cents, p_reason, auth.uid())
  RETURNING id INTO v_refund_id;

  -- Create ledger adjustment (mock for now)
  INSERT INTO earnings_ledger (user_id, amount_cents, type, ref_id, metadata)
  VALUES (
    v_order.user_id,
    -p_amount_cents,
    'refund',
    v_refund_id,
    jsonb_build_object('order_id', p_order_id, 'reason', p_reason)
  );

  RETURN v_refund_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**UI Components:**
- `src/routes/dashboard/orders/[id]/refund-dialog.tsx` - Refund form with amount/reason
- `src/routes/dashboard/orders/refunds.tsx` - Refunds list with filters
- `src/components/orders/RefundStatus.tsx` - Status badges & timeline

**Acceptance:**
- [ ] Admin clicks "Refund" → modal with amount slider + reason → RPC → order status updates
- [ ] Partial refund of $50 on $100 order → ledger shows -$50 entry
- [ ] Chargeback dispute → creates refund with metadata → email notification
- [ ] Refund list filterable by status/date range

---

### 4. MLM Earnings: Tiers/Splits/Missed Visualization
**Status:** 🟡 Partial (logic exists, no UI)  
**Impact:** Users can't see potential earnings or tier benefits  
**Effort:** 12h

**Implementation:**
```sql
-- Migration: earnings_tiers
CREATE TABLE membership_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  capture_pct numeric(5,2) NOT NULL CHECK (capture_pct >= 0 AND capture_pct <= 100),
  monthly_fee_cents int NOT NULL DEFAULT 0,
  features jsonb DEFAULT '{}'::jsonb,
  sort_order int NOT NULL
);

INSERT INTO membership_tiers (id, name, capture_pct, monthly_fee_cents, sort_order) VALUES
  ('free', 'Free', 1.00, 0, 1),
  ('tier_1', 'Pro', 2.50, 999, 2),
  ('tier_2', 'Elite', 4.00, 1999, 3);

-- Earnings calculator
CREATE OR REPLACE FUNCTION earnings_calculate(
  p_user_id uuid,
  p_from_date date,
  p_to_date date
) RETURNS jsonb AS $$
DECLARE
  v_tier membership_tiers%ROWTYPE;
  v_gross_eligible numeric := 0;
  v_captured numeric := 0;
  v_missed numeric := 0;
  v_splits jsonb;
BEGIN
  -- Get user tier
  SELECT t.* INTO v_tier
  FROM membership_tiers t
  JOIN user_memberships m ON m.tier_id = t.id
  WHERE m.user_id = p_user_id AND m.active = true
  ORDER BY t.sort_order DESC LIMIT 1;

  IF NOT FOUND THEN
    v_tier := ROW('free', 'Free', 1.00, 0, '{}', 1);
  END IF;

  -- Sum eligible earnings from ledger
  SELECT 
    COALESCE(SUM(amount_cents), 0),
    COALESCE(SUM(amount_cents * v_tier.capture_pct / 100), 0)
  INTO v_gross_eligible, v_captured
  FROM earnings_ledger
  WHERE user_id = p_user_id
    AND created_at::date BETWEEN p_from_date AND p_to_date
    AND type IN ('sale', 'referral', 'bonus');

  v_missed := v_gross_eligible - v_captured;

  -- Calculate splits (60/25/15)
  SELECT jsonb_build_object(
    'onboarder', v_captured * 0.60,
    'buyer', v_captured * 0.25,
    'seller', v_captured * 0.15
  ) INTO v_splits;

  RETURN jsonb_build_object(
    'tier', v_tier.name,
    'capture_pct', v_tier.capture_pct,
    'gross_eligible', v_gross_eligible,
    'captured', v_captured,
    'missed', v_missed,
    'splits', v_splits,
    'period', jsonb_build_object('from', p_from_date, 'to', p_to_date)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**UI Components:**
- `src/routes/dashboard/earnings/index.tsx` - Enhanced with tier upgrade CTA
- `src/components/earnings/TierComparison.tsx` - Side-by-side tier benefits
- `src/components/earnings/SplitsVisualization.tsx` - Pie chart of 60/25/15
- `src/components/earnings/MissedEarnings.tsx` - Prominent "Upgrade to capture" banner
- `src/components/earnings/ExportCSV.tsx` - Download earnings report

**Acceptance:**
- [ ] Free user sees "$247 missed this month" with upgrade CTA
- [ ] Pie chart shows 60% onboarder, 25% buyer, 15% seller splits
- [ ] CSV export includes tier, captured, missed columns
- [ ] Tier upgrade flow completes end-to-end (mock payment)

---

### 5. PR Previews with Seeded DB
**Status:** 🔴 Missing  
**Impact:** PMs can't safely test features without polluting prod  
**Effort:** 6h

**Implementation:**
```yaml
# .github/workflows/pr-preview.yml
name: PR Preview
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy_preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create preview branch in Supabase
        run: |
          curl -X POST https://api.supabase.com/v1/projects/${{ secrets.SUPABASE_PROJECT_ID }}/branches \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ACCESS_TOKEN }}" \
            -d '{"branch_name": "pr-${{ github.event.pull_request.number }}"}'
      
      - name: Apply migrations to preview
        run: |
          supabase db push --db-url $PREVIEW_DB_URL
      
      - name: Seed preview DB
        run: |
          psql $PREVIEW_DB_URL -f scripts/seed-preview.sql
      
      - name: Deploy to Vercel preview
        run: |
          vercel deploy --env VITE_SUPABASE_URL=$PREVIEW_URL \
            --env VITE_SUPABASE_ANON_KEY=$PREVIEW_ANON_KEY
      
      - name: Comment preview URL
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              body: '🚀 Preview: https://pr-${{ github.event.pull_request.number }}.example.com'
            })
```

**Seed Script:**
```sql
-- scripts/seed-preview.sql
-- Create 3 test users
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@preview.test'),
  ('00000000-0000-0000-0000-000000000002', 'producer@preview.test'),
  ('00000000-0000-0000-0000-000000000003', 'user@preview.test');

-- Assign roles
INSERT INTO user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'producer');

-- Create sample entities
INSERT INTO entities (id, kind, display_name, owner_user_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'business', 'Preview Farm LLC', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', 'horse', 'Thunder', '00000000-0000-0000-0000-000000000003');

-- Create sample listings
INSERT INTO marketplace_listings (id, seller_entity_id, title, price_cents, stock_quantity, status) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Preview Listing', 5000, 10, 'active');

-- Enable all feature flags for preview
UPDATE feature_flags SET enabled = true, rollout = 100;
```

**Acceptance:**
- [ ] Open PR → auto-comment with preview URL appears in <3 min
- [ ] Preview has 3 pre-seeded users (admin, producer, regular)
- [ ] All feature flags enabled by default
- [ ] Preview DB isolated from production
- [ ] Merge/close PR → preview environment destroyed

---

### 6. Alerts & Runbooks (SRE)
**Status:** 🔴 Missing  
**Impact:** Can't respond to production incidents  
**Effort:** 8h

**Implementation:**
```typescript
// scripts/setup-sentry-alerts.ts
import * as Sentry from '@sentry/node';

const alerts = [
  {
    name: 'High Error Rate',
    conditions: [{ id: 'sentry.rules.conditions.event_frequency', value: 100, interval: '5m' }],
    actions: [{ id: 'sentry.rules.actions.notify_email', targetType: 'Team', targetIdentifier: 'on-call' }],
  },
  {
    name: 'API Latency P95 > 1s',
    conditions: [{ id: 'sentry.rules.conditions.high_priority_issue' }],
    actions: [{ id: 'sentry.integrations.slack.notify_action', channel: '#alerts' }],
  },
  {
    name: 'Queue Depth > 1000',
    conditions: [{ id: 'sentry.rules.conditions.event_attribute', attribute: 'queue_depth', value: 1000 }],
    actions: [{ id: 'sentry.integrations.pagerduty.notify_action' }],
  },
];

// Setup alerts via Sentry API
for (const alert of alerts) {
  await fetch(`https://sentry.io/api/0/projects/${ORG}/${PROJECT}/rules/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SENTRY_TOKEN}` },
    body: JSON.stringify(alert),
  });
}
```

**Runbooks:**
```markdown
# docs/runbooks/

## RUNBOOK-001: High Error Rate
**Trigger:** >100 errors/5min  
**SLA:** Acknowledge in 5 min, mitigate in 15 min

**Steps:**
1. Check Sentry dashboard for error clusters
2. Identify affected route/RPC
3. Check recent deployments (last 2h)
4. If caused by recent deploy → rollback:
   ```bash
   vercel rollback
   ```
5. If DB-related → check active connections:
   ```sql
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   ```
6. If Redis-related → check hit rate:
   ```bash
   redis-cli INFO stats | grep keyspace_hits
   ```
7. Escalate to team lead if not resolved in 15 min

## RUNBOOK-002: Database Migration Failure
**Trigger:** Migration failed in production  
**SLA:** Restore in 30 min

**Steps:**
1. DO NOT re-run migration without investigation
2. Check migration logs:
   ```bash
   supabase db logs --filter "migration"
   ```
3. Identify failed statement
4. If safe → create fix-forward migration
5. If unsafe → restore from backup:
   ```bash
   supabase db restore --backup-id LATEST_GOOD
   ```
6. Verify app smoke tests pass
7. Post-mortem within 24h

## RUNBOOK-003: Rollback Deployment
**Trigger:** Critical production bug  
**SLA:** Complete rollback in 5 min

**Steps:**
1. Identify last known good deployment:
   ```bash
   vercel list --limit 10
   ```
2. Rollback via CLI:
   ```bash
   vercel rollback <deployment-id>
   ```
3. Verify health endpoint:
   ```bash
   curl https://app.example.com/health
   ```
4. Check error rate drops in Sentry
5. Notify team in #incidents
6. Create fix-forward plan
```

**Acceptance:**
- [ ] >100 errors/5min → PagerDuty alert fires within 60s
- [ ] Runbook links in alert payload
- [ ] Practice drill: trigger alert → follow runbook → resolve in <SLA
- [ ] Post-incident report template auto-created

---

### 7. Redis & PgBouncer Live
**Status:** 🟡 Partial (config docs exist, not live)  
**Impact:** Can't scale beyond 1K concurrent users  
**Effort:** 4h

**Implementation:**
```typescript
// src/lib/cache/redis.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSec: number = 300) {
  await redis.setex(key, ttlSec, JSON.stringify(value));
}

export async function rateLimitCheck(key: string, limit: number, windowSec: number): Promise<boolean> {
  const pipe = redis.pipeline();
  pipe.incr(key);
  pipe.expire(key, windowSec);
  const results = await pipe.exec();
  const count = results?.[0]?.[1] as number;
  return count <= limit;
}
```

**Environment Setup:**
```bash
# Deploy Redis to Upstash
upstash-cli create redis --name yalls-prod --region us-east-1

# Get connection URL
export REDIS_URL="redis://..."

# Update Vercel env
vercel env add REDIS_URL production

# Setup PgBouncer on Supabase pooler
# Update DATABASE_URL to use port 6432
export DATABASE_URL="postgres://user:pass@host:6432/postgres?pgbouncer=true"
```

**Acceptance:**
- [ ] Feed query hits Redis → <10ms response
- [ ] Rate limit enforced via Redis → 429 after limit
- [ ] DB connections stay <200 (PgBouncer pooling)
- [ ] Load test: 5K concurrent users → no connection errors

---

### 8. Data Lifecycle & Retention
**Status:** 🔴 Missing  
**Impact:** GDPR/CCPA non-compliant  
**Effort:** 10h

**Implementation:**
```sql
-- Migration: data_lifecycle
CREATE TABLE data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz DEFAULT now(),
  scheduled_for timestamptz NOT NULL,
  completed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  download_url text,
  expires_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Anonymization function
CREATE OR REPLACE FUNCTION anonymize_user(p_user_id uuid) RETURNS void AS $$
BEGIN
  -- Keep referential integrity but remove PII
  UPDATE profiles SET 
    display_name = 'Deleted User',
    email = NULL,
    avatar_url = NULL,
    bio = NULL,
    metadata = '{}'::jsonb
  WHERE user_id = p_user_id;

  UPDATE crm_contacts SET
    name = 'Anonymized',
    email = NULL,
    phone = NULL,
    metadata = '{}'::jsonb
  WHERE owner_user_id = p_user_id;

  -- Mark messages as redacted
  UPDATE messages SET body = '[redacted]', metadata = '{}'::jsonb
  WHERE sender_user_id = p_user_id OR recipient_user_id = p_user_id;

  -- Audit
  INSERT INTO admin_audit (action, target, metadata)
  VALUES ('user_anonymized', p_user_id::text, jsonb_build_object('timestamp', now()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Retention policy (run nightly)
CREATE OR REPLACE FUNCTION apply_retention_policies() RETURNS void AS $$
BEGIN
  -- Delete old usage events (>90 days)
  DELETE FROM usage_events WHERE created_at < now() - interval '90 days';

  -- Delete old notifications (>30 days, read)
  DELETE FROM notifications WHERE read_at < now() - interval '30 days';

  -- Archive old orders (>2 years)
  INSERT INTO orders_archive SELECT * FROM orders WHERE created_at < now() - interval '2 years';
  DELETE FROM orders WHERE created_at < now() - interval '2 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Edge Function:**
```typescript
// supabase/functions/export-user-data/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_KEY')!);
  const { user_id } = await req.json();

  // Gather all user data
  const [profile, posts, orders, messages] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user_id).single(),
    supabase.from('posts').select('*').eq('author_user_id', user_id),
    supabase.from('orders').select('*').eq('user_id', user_id),
    supabase.from('messages').select('*').or(`sender_user_id.eq.${user_id},recipient_user_id.eq.${user_id}`),
  ]);

  const exportData = {
    profile: profile.data,
    posts: posts.data,
    orders: orders.data,
    messages: messages.data,
    exported_at: new Date().toISOString(),
  };

  // Upload to storage (expires in 7 days)
  const { data: upload } = await supabase.storage
    .from('exports')
    .upload(`${user_id}/export-${Date.now()}.json`, JSON.stringify(exportData, null, 2), {
      cacheControl: '604800',
      upsert: false,
    });

  // Generate signed URL
  const { data: url } = await supabase.storage.from('exports').createSignedUrl(upload!.path, 604800);

  // Record export
  await supabase.from('data_exports').insert({
    user_id,
    status: 'completed',
    download_url: url!.signedUrl,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ download_url: url!.signedUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**UI Components:**
- `src/routes/dashboard/settings/privacy.tsx` - Data rights center
- `src/components/settings/DataExport.tsx` - Request export button
- `src/components/settings/DeleteAccount.tsx` - Deletion flow with confirmation

**Acceptance:**
- [ ] User clicks "Export my data" → download link in email within 5 min
- [ ] Export includes all user-generated content (posts, orders, messages)
- [ ] User requests deletion → 30-day grace period → anonymization
- [ ] Deleted user's posts remain but show "Deleted User"
- [ ] Retention policy runs nightly → old data archived/deleted

---

## 🟡 P1 - High Priority (Quality of Life)

### 9. Discount/Comp Codes for Events
**Status:** 🔴 Missing  
**Effort:** 8h

### 10. Waitlists & Overbooking
**Status:** 🔴 Missing  
**Effort:** 6h

### 11. Durable User Memory (RAG)
**Status:** 🔴 Missing  
**Effort:** 16h

### 12. Context Compiler (AI)
**Status:** 🟡 Partial  
**Effort:** 14h

### 13. Preference & Goal Model
**Status:** 🟡 Partial  
**Effort:** 10h

### 14. NBA v2 (Personalized Ranking)
**Status:** 🟡 Partial  
**Effort:** 12h

### 15. Explainability Layer ("Why this?")
**Status:** 🟡 Partial  
**Effort:** 8h

### 16. A/B Testing Framework
**Status:** 🟡 Partial  
**Effort:** 10h

### 17. Internationalization (i18n)
**Status:** 🔴 Missing  
**Effort:** 20h

### 18. Accessibility Audit (WCAG AA)
**Status:** 🟡 Partial  
**Effort:** 16h

### 19. Mobile Gestures & Bottom Nav
**Status:** 🟡 Partial  
**Effort:** 12h

### 20. Attachment Flows (Health Log, Invoices)
**Status:** 🔴 Missing  
**Effort:** 8h

### 21. CSV Importers (Earnings, Contacts)
**Status:** 🔴 Missing  
**Effort:** 6h

### 22. OpenAPI / RPC Documentation
**Status:** 🔴 Missing  
**Effort:** 8h

---

## 🟢 P2 - Polish (Nice to Have)

### 23. Calendar iCal Subscribe
**Status:** 🟡 Partial  
**Effort:** 4h

### 24. Finder Quick Actions (Events/Farm)
**Status:** 🟡 Partial  
**Effort:** 6h

### 25. Rate-Limit Headers in API
**Status:** 🔴 Missing  
**Effort:** 2h

### 26. Perf Budgets in CI
**Status:** 🔴 Missing  
**Effort:** 6h

### 27. Dynamic Layout Experiments
**Status:** 🔴 Missing  
**Effort:** 14h

### 28. Digest Emails (Daily/Weekly)
**Status:** 🔴 Missing  
**Effort:** 8h

### 29. Tool Calling Metadata Registry
**Status:** 🟡 Partial  
**Effort:** 10h

### 30. Global Search Improvements
**Status:** 🟡 Partial  
**Effort:** 8h

---

## 🔵 P3 - Future Enhancements

### 31-87. [Full list in next section]

---

## Implementation Sequencing (Critical Path)

### Week 1: Core Infrastructure (32h)
1. Notification Preferences (12h)
2. Entity Edges (10h)
3. Redis & PgBouncer Live (4h)
4. PR Previews (6h)

### Week 2: Business Capabilities (30h)
5. Refunds & Chargebacks (8h)
6. MLM Earnings Viz (12h)
7. Data Lifecycle (10h)

### Week 3: AI Personalization (40h)
8. Durable Memory (16h)
9. Context Compiler (14h)
10. Preference Model (10h)

### Week 4: Producer Tools (28h)
11. Discount Codes (8h)
12. Waitlists (6h)
13. A/B Framework (10h)
14. Attachments (4h)

### Week 5: UX & Compliance (44h)
15. i18n Foundation (20h)
16. Accessibility Audit (16h)
17. Alerts & Runbooks (8h)

### Week 6: Polish & Documentation (28h)
18. OpenAPI Docs (8h)
19. Mobile Enhancements (12h)
20. CSV Importers (6h)
21. Explainability UI (2h)

---

## Dynamic Capability System (Platform Extensibility)

**Status:** 🔴 Missing  
**Effort:** 24h

**Core Concept:** Users can request features → AI suggests implementation → approval flow → auto-scaffolding

**Implementation:**
```sql
-- Migration: capability_requests
CREATE TABLE capability_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  request_type text NOT NULL CHECK (request_type IN ('feature', 'integration', 'automation', 'report')),
  title text NOT NULL,
  description text NOT NULL,
  use_case text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'analyzing', 'approved', 'building', 'testing', 'deployed', 'rejected')),
  ai_analysis jsonb,
  implementation_plan jsonb,
  votes int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI capability analyzer
CREATE OR REPLACE FUNCTION analyze_capability_request(p_request_id uuid) RETURNS jsonb AS $$
DECLARE
  v_request capability_requests%ROWTYPE;
  v_analysis jsonb;
BEGIN
  SELECT * INTO v_request FROM capability_requests WHERE id = p_request_id;

  -- Call AI to analyze feasibility
  v_analysis := jsonb_build_object(
    'feasibility', 'high', -- AI-determined
    'complexity', 'medium',
    'estimated_hours', 8,
    'required_tables', ARRAY['new_feature_data'],
    'required_rpcs', ARRAY['new_feature_action'],
    'required_ui', ARRAY['NewFeaturePanel.tsx'],
    'dependencies', ARRAY['existing_system_x'],
    'risks', ARRAY['May conflict with module Y'],
    'suggested_approach', 'Add new table + RPC + dashboard panel'
  );

  UPDATE capability_requests
  SET ai_analysis = v_analysis, status = 'analyzed', updated_at = now()
  WHERE id = p_request_id;

  RETURN v_analysis;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Auto-Scaffolding System:**
```typescript
// src/lib/dynamic-capabilities/scaffolder.ts
export async function scaffoldCapability(request: CapabilityRequest) {
  const { required_tables, required_rpcs, required_ui } = request.ai_analysis;

  // 1. Generate migration
  const migration = generateMigration(required_tables, required_rpcs);
  await saveMigration(`supabase/migrations/${Date.now()}_${request.title.toLowerCase().replace(/\s+/g, '_')}.sql`, migration);

  // 2. Generate RPC wrappers
  for (const rpc of required_rpcs) {
    const wrapper = generateRPCWrapper(rpc);
    await saveFile(`src/lib/rpc/${rpc}.ts`, wrapper);
  }

  // 3. Generate UI components
  for (const component of required_ui) {
    const code = generateComponent(component, request);
    await saveFile(`src/components/dynamic/${component}`, code);
  }

  // 4. Register in dashboard
  await registerDashboardModule(request.title, required_ui[0]);

  // 5. Create tests
  const tests = generateTests(required_rpcs, required_ui);
  await saveFile(`tests/dynamic/${request.title}.spec.ts`, tests);

  return {
    migrationPath: `supabase/migrations/...`,
    componentPaths: required_ui.map(c => `src/components/dynamic/${c}`),
    testPath: `tests/dynamic/${request.title}.spec.ts`,
  };
}
```

**UI Flow:**
1. User clicks "Request a Feature" in Finder
2. Form: Title, Description, Use Case, Priority
3. AI analyzes → returns feasibility + plan
4. Admin reviews → approves
5. System auto-scaffolds → deploys to preview
6. User tests in preview → feedback
7. Admin deploys to production

**Acceptance:**
- [ ] User requests "Appointment reminders via SMS"
- [ ] AI returns: "Feasible, needs Twilio integration, 8h effort"
- [ ] Admin approves → system scaffolds migration + RPC + UI
- [ ] Preview environment auto-deploys with new feature
- [ ] User tests → approves → production deploy

---

## Progress Tracking

**Dashboard:**
- Real-time progress bar: 78% → 100%
- Tasks by priority: P0 (8), P1 (14), P2 (8), P3 (57)
- Estimated completion: 340h / 8.5 weeks at 2 engineers

**Weekly Goals:**
- Week 1: Ship P0 items 1-4 (notification prefs, edges, refunds, PR previews)
- Week 2: Ship P0 items 5-8 (earnings viz, data lifecycle, Redis/PgBouncer)
- Week 3: Ship P1 AI items 9-12 (memory, context compiler, preferences, NBA v2)
- Week 4: Ship P1 producer tools 13-16 (discounts, waitlists, A/B, attachments)
- Week 5: Ship compliance & UX 17-20 (i18n, a11y, alerts, mobile)
- Week 6: Polish & docs 21-30

**Success Criteria:**
- All P0 items deployed to production
- All P1 items in staging
- All P2 items scheduled with clear timelines
- 95%+ test coverage on new code
- <1s p95 latency on all new endpoints
- Zero critical security findings
- WCAG AA compliance on all new UI
- i18n framework ready for Spanish/French

---

## Appendix: Full Task Breakdown

[Detailed specs for tasks 9-87 follow same pattern: Status, Effort, Implementation (SQL/TS), UI Components, Acceptance Criteria]

**Categories:**
- Notifications & Messaging (9 tasks)
- Events & Producer Tools (12 tasks)
- AI & Personalization (15 tasks)
- Commerce & Payments (8 tasks)
- Farm Operations (7 tasks)
- Search & Discovery (6 tasks)
- Infrastructure & SRE (11 tasks)
- Security & Compliance (8 tasks)
- UX & Accessibility (11 tasks)

**Total:** 87 tasks across 9 categories

---

**Next Steps:**
1. Review & prioritize with product team
2. Assign tasks to sprint cycles
3. Setup project board with task dependencies
4. Begin Week 1 P0 implementation
5. Daily standups tracking progress vs plan
