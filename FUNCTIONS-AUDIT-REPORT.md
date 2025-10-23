# 🔍 COMPLETE SUPABASE FUNCTIONS AUDIT

**Generated:** Run `deno run -A scripts/audit-functions.ts` to update this report

## 📊 Quick Stats

- **Total in config.toml:** Run audit to populate
- **Total actual folders:** Run audit to populate  
- **Healthy (both):** Run audit to populate
- **👻 Ghosts (config only):** Run audit to populate
- **🔧 Orphans (folder only):** Run audit to populate
- **⚠️ Duplicates:** Run audit to populate

---

## 📋 ALL CONFIG ENTRIES (from config.toml)

### Core AI Systems
- `super-andy-chat` - JWT✓
- `admin-rocker-chat` - JWT✓  
- `user-rocker-chat` - JWT✓

### Andy Subsystem
- `andy-chat` - JWT✓
- `andy-embed-knowledge` - PUBLIC
- `andy-admin` - JWT✓
- `andy-auto-analyze` - PUBLIC
- `andy-expand-memory` - PUBLIC
- `andy-enhance-memories` - PUBLIC

### Rocker AI Functions
- `rocker-web-search` - PUBLIC
- `rocker-emit-action` - JWT✓
- `rocker-memory` - JWT✓
- `rocker-admin` - JWT✓
- `rocker-organize-knowledge` - JWT✓
- `rocker-organize-all` - JWT✓
- `rocker-ingest` - JWT✓
- `rocker-deep-analyze` - JWT✓
- `rocker-reprocess-all` - JWT✓
- `rocker-tasks` - JWT✓
- `rocker-chat-simple` - JWT✓
- `rocker-chat` - JWT✓
- `rocker-verify-feature` - JWT✓
- `rocker-health` - PUBLIC
- `rocker-proposals` - JWT✓
- `rocker-fetch-url` - JWT✓
- `rocker-telemetry` - JWT✓
- `rocker-send-outbox` - PUBLIC [CRON: * * * * *]
- `rocker-sms-webhook` - PUBLIC
- `rocker-daily-tick` - PUBLIC [CRON: 0 * * * *]
- `rocker-proactive-sweep` - PUBLIC [CRON: 0 */6 * * *]
- `rocker-capability-ranker` - PUBLIC [CRON: 0 4 * * *]
- `rocker-web-research` - PUBLIC
- `rocker-auto-audit` - PUBLIC
- `rocker-lifecycle-manager` - PUBLIC
- `rocker-proactive-notifier` - PUBLIC
- `rocker-crawl-site` - JWT✓
- `rocker-ingest-repo` - JWT✓
- `rocker-audit` - JWT✓
- `rocker-reembed` - JWT✓
- `rocker-audit-system` - JWT✓
- `rocker-insights` - JWT✓
- `rocker-proactive-30min` - PUBLIC [CRON: */30 * * * *]
- `rocker-reembed-all` - JWT✓
- `rocker-monitor` - PUBLIC [CRON: */15 * * * *]

### Automation & Crons
- `auto-sync-entities` - PUBLIC [CRON: 0 * * * *]
- `process-mail-outbox` - PUBLIC [CRON: */5 * * * *]
- `generate-embeddings` - PUBLIC [CRON: */2 * * * *]
- `process-jobs` - PUBLIC
- `nightly-gap-scan` - PUBLIC [CRON: 0 2 * * *]
- `nightly-consolidate-notes` - PUBLIC [CRON: 0 3 * * *]

### Content & Knowledge Base
- `doc-analyzer` - JWT✓
- `moderate-memory` - JWT✓
- `kb-ingest` - JWT✓
- `kb-search` - JWT✓
- `kb-item` - JWT✓
- `kb-related` - JWT✓
- `kb-playbook` - JWT✓
- `term-lookup` - JWT✓

### Social & Posts
- `generate-preview` - JWT✓
- `upload-media` - JWT✓
- `save-post` - JWT✓
- `unsave-post` - JWT✓
- `reshare-post` - JWT✓
- `recall-content` - JWT✓
- `feed-api` - PUBLIC
- `auto-pin-business` - PUBLIC

### AI Learning & Memory
- `aggregate-learnings` - PUBLIC
- `analyze-memories` - JWT✓
- `analyze-traces` - PUBLIC
- `generate-suggestions` - PUBLIC
- `apply-deltas` - PUBLIC

### Payments & Stripe
- `create-checkout-session` - JWT✓
- `stripe-webhook` - PUBLIC (✅ hyphen version)
- `stripe_webhook` - PUBLIC (⚠️ DUPLICATE - underscore)
- `preview-pay-checkout` - JWT✓
- `preview-pay-labels` - JWT✓

### Communication
- `email-inbound` - PUBLIC
- `process-inbound-email` - PUBLIC
- `twilio_webhook` - PUBLIC (⚠️ has underscore)
- `summarize-thread` - JWT✓
- `chat-store` - JWT✓

### Consent & Privacy
- `consent-status` - JWT✓
- `consent-accept` - JWT✓
- `consent-revoke` - JWT✓
- `delete-account` - JWT✓

### Health & Monitoring
- `health-liveness` - PUBLIC
- `health-readiness` - PUBLIC
- `ai_health` - PUBLIC
- `run-tests` - JWT✓

### Entity Management
- `entity-lookup` - JWT✓
- `bootstrap-super-admin` - JWT✓
- `promotion-manager` - JWT✓
- `generate-event-form` - JWT✓

### AI Ranking & Curation
- `ai-rank-search` - JWT✓
- `ai-curate-feed` - JWT✓

### AI Control Plane
- `ai_eventbus` - PUBLIC
- `ai_control` - JWT✓
- `ai_admin_bind` - JWT✓

### 👻 GHOST FUNCTIONS (In config, no folder - WILL BE RESTORED)

#### CTM (Conversation Task Memory) Subsystem
- `ctm_extract` - JWT✓
- `ctm_daily_report` - JWT✓
- `ctm_reminder_tick` - JWT✓

#### MDR (Multi-Dimensional Reasoning) Subsystem
- `mdr_generate` - JWT✓
- `mdr_consensus` - JWT✓
- `mdr_orchestrate` - JWT✓

#### Safety & Autonomy
- `safety_commit_guard` - JWT✓

#### Schedulers & Watchdogs
- `cron_tick` - PUBLIC
- `watchdog_tick` - PUBLIC
- `metrics_export` - PUBLIC
- `dlq_replay` - PUBLIC

#### AI Learning & Improvement
- `self_improve_tick` - PUBLIC [CRON: 0 2 * * *]
- `perceive_tick` - PUBLIC [CRON: 0 */6 * * *]
- `verify_output` - JWT✓
- `model_router` - JWT✓
- `federate_share` - PUBLIC
- `daily_digest_tick` - PUBLIC
- `circuit_breaker_tick` - PUBLIC [CRON: */15 * * * *]
- `red_team_tick` - PUBLIC [CRON: 0 3 * * *]
- `fine_tune_cohort` - JWT✓
- `feedback_rate` - JWT✓

---

## ⚠️ KNOWN DUPLICATES

1. **stripe_webhook** (underscore) vs **stripe-webhook** (hyphen)
   - ✅ Keep: `stripe-webhook` 
   - ❌ Remove: `stripe_webhook`

2. **twilio_webhook** (underscore) - should be **twilio-webhook** (hyphen)
   - Need to normalize

---

## 🎯 RESTORATION PLAN

### Phase 1: Restore Ghost Functions
Run: `deno run -A scripts/restore-ghost-functions.ts`

This will create stub implementations for all 40+ ghost functions that are in config but missing folders.

### Phase 2: Remove Duplicates  
- Delete `stripe_webhook` config entry
- Rename `twilio_webhook` to `twilio-webhook` (if folder exists)

### Phase 3: Verify
Run: `deno run -A scripts/audit-functions.ts`

Should show:
- 0 ghosts
- 0 duplicates
- All functions healthy

---

## 📝 NOTES

- **JWT✓** = Requires authentication (`verify_jwt = true`)
- **PUBLIC** = No authentication required (`verify_jwt = false`)
- **[CRON]** = Has scheduled execution
- Ghost functions will be restored as stubs that return `{ status: "stub", message: "Not yet implemented" }`
- All ghost functions need actual implementation logic added after restoration

---

**To regenerate this report with current stats:**
```bash
deno run -A scripts/audit-functions.ts
```

**To restore all ghost functions:**
```bash
deno run -A scripts/restore-ghost-functions.ts
```

**To see full JSON breakdown:**
```bash
cat scripts/audit-results.json
```
