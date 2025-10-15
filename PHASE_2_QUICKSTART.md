# Phase 2 Quick Wins - Implementation Guide

## ✅ Completed

### 1. Rate Limit Codemod
Created `scripts/enforce-rate-limit.ts` to auto-wrap all edge functions with rate limiting.

**Run it:**
```bash
deno run -A scripts/enforce-rate-limit.ts
```

**What it does:**
- Scans all `supabase/functions/*/index.ts` files
- Adds `withRateLimit` import if missing
- Inserts rate limiting check after CORS block
- Uses appropriate tier per function:
  - `admin`: outbox-drain
  - `auth`: delete-account
  - `high`: health-liveness, health-readiness, kb-search
  - `expensive`: rocker-chat, rocker-voice-session, upload-media, generate-embeddings, kb-ingest
  - `standard`: all others

### 2. Partition Management Function
Created `app.ensure_crm_event_partitions()` for monthly partition automation.

**Status:** Function ready, table conversion pending (requires downtime)

**To enable (when ready):**
```sql
-- 1. Enable pg_cron (via Supabase dashboard → Database → Extensions)

-- 2. Convert table (requires brief downtime)
CREATE TABLE crm_events_new (LIKE crm_events INCLUDING ALL) 
  PARTITION BY RANGE (ts);
INSERT INTO crm_events_new SELECT * FROM crm_events;
DROP TABLE crm_events;
ALTER TABLE crm_events_new RENAME TO crm_events;

-- 3. Create initial partitions
SELECT app.ensure_crm_event_partitions(3);

-- 4. Schedule daily maintenance
SELECT cron.schedule(
  'ensure-partitions',
  '5 1 * * *',
  $$SELECT app.ensure_crm_event_partitions(3);$$
);
```

## 📋 Next Steps

### 3. Cloudflare Cache Rules
Configure in Cloudflare dashboard (Rules → Cache Rules):

**Rule 1: Static Assets**
- Match: `*.css OR *.js OR /assets/* OR /images/*`
- Edge TTL: 1 day
- Browser TTL: 5 minutes
- Cache Key: Ignore Query String
- Enable: Stale while revalidate

**Rule 2: Bypass API**
- Match: `/functions/* OR /auth/* OR /api/*`
- Action: Bypass cache

**Rule 3: HTML Pages**
- Match: MIME contains `text/html`
- Edge TTL: 10 minutes
- Enable: Stale while revalidate

### 4. Verification Commands

**Multi-tenancy fixed:**
```bash
git grep -n "00000000-0000-0000-0000-000000000000" || echo "✅ none"
```

**Rate limiting coverage:**
```bash
git grep -n "Deno.serve" supabase/functions \
  | cut -d: -f1 \
  | sort -u \
  | xargs -I{} bash -c 'echo {}; git grep -n "withRateLimit" {} || echo "MISSING"'
```

**Console logs cleaned:**
```bash
git grep -nE "console\.(log|error|warn|info)" src supabase/functions \
  | grep -v "PII-safe" || echo "✅ clean"
```

### 5. Smoke Tests

**Health endpoints rate-limited:**
```bash
# Should return 429 after burst limit
for i in {1..50}; do
  curl https://[project].supabase.co/functions/v1/health-liveness
done
```

**Multi-tenant isolation:**
```bash
# Two users, same email → different contact_ids
curl -H "Authorization: Bearer $USER_A_TOKEN" \
     -d '{"type":"view","props":{"business_id":"..."},"contact":{"email":"same@test.com"}}' \
     https://[project].supabase.co/functions/v1/crm-track

curl -H "Authorization: Bearer $USER_B_TOKEN" \
     -d '{"type":"view","props":{"business_id":"..."},"contact":{"email":"same@test.com"}}' \
     https://[project].supabase.co/functions/v1/crm-track
```

## 🎯 Expected Impact

After running the codemod and configuring Cloudflare:

- **Rate Limiting:** All edge functions protected (count in Control Room should drop to 0)
- **Multi-Tenancy:** No hardcoded tenant IDs (git grep returns 0 results)
- **CDN Hit Rate:** ≥80% for static assets, ~30-50% TTFB reduction
- **Partition Ready:** Function scheduled, will auto-create monthly partitions once table is converted

## 🚀 Phase 3 Preview

Once these quick wins are deployed:
- Redis read-through cache for hot GETs
- Supabase Enterprise features (connection pooling, read replicas)
- Advanced monitoring & alerting
- Auto-scaling infrastructure

---

**TL;DR:** Run the codemod now, configure Cloudflare rules, schedule partition conversion during low-traffic window.
