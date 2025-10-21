# Branching Strategy & Work Distribution Plan

## 🎯 Goal
Ship production-ready platform in **2 weeks** by parallelizing work across 4-5 streams with zero conflicts.

## 🌳 Branch Model

```
main (protected)
├── staging (daily integration)
│   ├── feature/ui-polish (UI-only, zero DB risk)
│   ├── feature/tenant-security (RLS + guards, expand-only)
│   ├── feature/search-isolation (dual index + RPCs)
│   ├── feature/job-queue (workers + async)
│   └── feature/observability (logs + metrics + tests)
```

### Branch Rules
- **main**: Production only. Requires 2 approvals + all CI green.
- **staging**: Integration branch. Deploys to staging Supabase project.
- **feature/***: Short-lived (3-5 days max). One clear owner.

## 🔑 Environment Split (Critical!)

### Current Problem
All branches point to same Supabase → migration conflicts + data chaos.

### Solution
Create 3 Supabase projects:

| Project | Branch | Purpose | DB Changes Allowed? |
|---------|--------|---------|---------------------|
| **yalls-prod** | `main` | Production | Baked migrations only |
| **yalls-staging** | `staging` + feature PRs | Integration testing | Yes, with approval |
| **yalls-scratch** | Risky DB features | Throwaway testing | Yes, anything |

### Environment Variables by Branch

```bash
# main → prod
SUPABASE_URL=https://xuxfuonzsfvrirdwzddt.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...prod
SUPABASE_SERVICE_ROLE_KEY=[prod-service-key]

# staging + PRs → staging
SUPABASE_URL=https://yalls-staging.supabase.co
SUPABASE_ANON_KEY=[staging-anon]
SUPABASE_SERVICE_ROLE_KEY=[staging-service]

# feature/risky-db → scratch
SUPABASE_URL=https://yalls-scratch.supabase.co
SUPABASE_ANON_KEY=[scratch-anon]
SUPABASE_SERVICE_ROLE_KEY=[scratch-service]
```

## 📋 Work Distribution (Parallel Streams)

### Stream 1: UI Polish & UX (Zero DB Risk)
**Branch**: `feature/ui-polish`  
**Owner**: Frontend specialist  
**Duration**: 5 days  
**Conflict Risk**: ⚪️ None (no DB changes)

**Tasks**:
- [ ] Fix onboarding flow (currently broken)
- [ ] Voice UI polish (waveforms, loading states)
- [ ] Responsive design fixes (mobile + tablet)
- [ ] Dark mode consistency
- [ ] Loading skeletons for all async states
- [ ] Error boundary components
- [ ] Toast notifications for edge cases
- [ ] Empty states for all lists
- [ ] Animation polish (framer-motion)
- [ ] Accessibility audit (WCAG 2.1 AA)

**Files Touched**: `src/pages/`, `src/components/`, `src/index.css`  
**Merges to**: `staging` daily  
**CI Required**: Lint + typecheck + visual regression tests

---

### Stream 2: Tenant Security (RLS + Guards)
**Branch**: `feature/tenant-security`  
**Owner**: Backend/security specialist  
**Duration**: 7 days  
**Conflict Risk**: 🟡 Medium (DB policies, no schema changes)

**Tasks**:
- [x] ~~Created `withTenantGuard` wrapper~~ (Done)
- [x] ~~Added org_id to rocker_threads, knowledge_items~~ (Done)
- [x] ~~Created RLS policies with org isolation~~ (Done)
- [ ] Migrate all edge functions to use `withTenantGuard`
  - [ ] rocker-chat
  - [ ] rocker-organize-knowledge (partial)
  - [ ] andy-chat
  - [ ] andy-voice-session
  - [ ] kb-search
  - [ ] kb-ingest
  - [ ] +40 more functions
- [ ] Remove all raw `supabase.from()` calls
- [ ] Add `org_id` to all missing tables:
  - [ ] rocker_files
  - [ ] voice_events
  - [ ] rocker_memories
  - [ ] learning_entries
- [ ] Lock feature flag writes to super_admin
- [ ] Audit script passes with zero warnings

**Files Touched**: `supabase/functions/*/index.ts`  
**DB Changes**: Policy updates only (safe, idempotent)  
**Merges to**: `staging` after every 5 functions migrated  
**CI Required**: Tenant guard check + RLS verification

---

### Stream 3: Search Isolation (Private vs Marketplace)
**Branch**: `feature/search-isolation`  
**Owner**: ML/search specialist  
**Duration**: 6 days  
**Conflict Risk**: 🟡 Medium (new tables + indices)

**Tasks**:
- [x] ~~Created `private_chunks` table~~ (Done)
- [x] ~~Created `market_chunks` table~~ (Done)
- [x] ~~Created `match_private_chunks` RPC~~ (Done)
- [x] ~~Created `match_market_chunks` RPC~~ (Done)
- [ ] Migrate existing embeddings to dual tables
  - [ ] Identify current embedding storage
  - [ ] Write migration script (idempotent)
  - [ ] Backfill `private_chunks` with org_id
  - [ ] Backfill `market_chunks` with public listings
- [ ] Create vector indices (ivfflat)
  - [ ] `private_chunks` index (per-org partitioning?)
  - [ ] `market_chunks` index (global)
- [ ] Update `kb-search` function
  - [ ] Call both `match_private_chunks` + `match_market_chunks`
  - [ ] Merge results at API layer
  - [ ] Add relevance scoring
- [ ] Create search analytics
  - [ ] Track private vs marketplace query ratio
  - [ ] Log zero-result queries
- [ ] Performance testing
  - [ ] Benchmark 10k orgs × 100k docs
  - [ ] Verify P95 < 200ms

**Files Touched**: `supabase/functions/kb-search/`, migrations  
**DB Changes**: New tables + indices (expand-only, safe)  
**Merges to**: `staging` after each major milestone  
**CI Required**: Search isolation tests

---

### Stream 4: Job Queue & Workers (Async Heavy Lifting)
**Branch**: `feature/job-queue`  
**Owner**: Backend/infra specialist  
**Duration**: 8 days  
**Conflict Risk**: 🟢 Low (new worker code, minimal shared files)

**Tasks**:
- [x] ~~Created `ingest_jobs` table~~ (Done)
- [x] ~~Created `claim_ingest_job` function~~ (Done)
- [x] ~~Created worker skeleton~~ (Done)
- [ ] Implement worker processors
  - [ ] Embedding processor (batch OpenAI calls)
  - [ ] Crawl processor (URL fetching + parsing)
  - [ ] OCR processor (image → text)
  - [ ] PDF processor (extract + chunk)
- [ ] Add per-org concurrency control
  - [ ] Verify `claim_ingest_job` respects limits
  - [ ] Add org-level queue depth metrics
- [ ] Retry logic + DLQ
  - [ ] Exponential backoff
  - [ ] Dead letter queue after 3 attempts
  - [ ] Alert on DLQ threshold
- [ ] Idempotency
  - [ ] Use `external_idempotency_key`
  - [ ] Return cached result if key exists
- [ ] Convert sync endpoints to async
  - [ ] `kb-ingest` → enqueue embed job
  - [ ] `ingest-upload` → enqueue OCR/parse job
  - [ ] `ingest-paste` → enqueue embed job
- [ ] Worker deployment
  - [ ] Deploy as edge function (cron-triggered?)
  - [ ] Or deploy to Fly.io/Railway as long-running worker
- [ ] Monitoring
  - [ ] Queue depth by org
  - [ ] Processing time P50/P95/P99
  - [ ] Error rate + DLQ size

**Files Touched**: `supabase/functions/workers-ingest/`, queue-related functions  
**DB Changes**: Jobs table + status tracking (expand-only)  
**Merges to**: `staging` after each processor works  
**CI Required**: Queue concurrency tests

---

### Stream 5: Observability & Testing (Verification)
**Branch**: `feature/observability`  
**Owner**: DevOps/QA specialist  
**Duration**: 10 days (runs parallel to all others)  
**Conflict Risk**: 🟢 Low (creates new files, reads everything)

**Tasks**:
- [ ] Structured logging
  - [ ] Add `request_id`, `org_id`, `actor_role` to all logs
  - [ ] Use `createLogger` from `logger.ts` everywhere
  - [ ] Ban `console.log` in CI
- [ ] Metrics collection
  - [ ] Per-org request rate
  - [ ] Per-endpoint latency (P50/P95/P99)
  - [ ] Queue depth by org
  - [ ] TTS TTFB (time to first byte)
  - [ ] Error rate by endpoint
- [ ] Dashboards
  - [ ] Grafana/Datadog setup
  - [ ] Real-time org activity
  - [ ] SLA tracking (99.9% uptime)
  - [ ] Cost attribution per org
- [ ] Alerting
  - [ ] P95 latency > 500ms
  - [ ] Error rate > 1%
  - [ ] Queue depth > 1000
  - [ ] DLQ size > 50
- [ ] Testing
  - [ ] Tenant isolation tests (no cross-org leaks)
  - [ ] k6 load tests (noisy neighbor scenarios)
  - [ ] RLS policy verification
  - [ ] Rate limit enforcement tests
  - [ ] Feature flag security tests
- [ ] Runbooks
  - [ ] TTS vendor outage
  - [ ] Queue backlog recovery
  - [ ] Database migration rollback
  - [ ] Security incident response
- [ ] CI/CD hardening
  - [ ] Block raw DB calls
  - [ ] Enforce tenant guard usage
  - [ ] Run security audit on every PR
  - [ ] Auto-rollback on critical alerts

**Files Touched**: `tests/`, `scripts/audit/`, new monitoring config  
**DB Changes**: None (read-only observability)  
**Merges to**: `staging` continuously  
**CI Required**: All tests must pass

---

## 🚦 CI/CD Gates (Must Pass to Merge)

### Pre-Merge Checklist
Every PR requires:

```bash
# 1. Lint + typecheck
npm run lint
npm run typecheck

# 2. Security audits
./scripts/audit/check-tenant-guards.sh  # Zero raw DB calls
./scripts/audit/verify-rls.sql          # All tables have RLS

# 3. Tests
npm run test:unit
npm run test:integration  # Tenant isolation

# 4. DB-specific (if migration present)
psql $STAGING_DB -f migration.sql  # Dry run on staging

# 5. Visual regression (UI-only PRs)
npm run test:visual
```

### Deployment Flow

```
feature/* → staging (auto-deploy after PR merge)
           ↓
        Staging bake (24-48 hours)
           ↓
      Cherry-pick to main (manual, approved)
           ↓
      Production deploy (canary → full rollout)
```

## 📅 Timeline (2-Week Sprint)

### Week 1: Foundation
- **Day 1-2**: Create staging + scratch Supabase projects, wire env vars
- **Day 3-5**: Stream 1 (UI) ships 50% + Stream 2 (Guards) migrates 15 functions
- **Day 6-7**: Stream 3 (Search) backfills dual tables + Stream 4 (Queue) deploys worker

### Week 2: Integration + Launch
- **Day 8-10**: All streams merge to staging, full integration testing
- **Day 11-12**: Load testing, security audit, runbook review
- **Day 13**: Production dress rehearsal (deploy to staging as-if prod)
- **Day 14**: Production deployment (canary 10% → 50% → 100%)

## 🔧 Tooling Setup

### Required Tools
```bash
# Install locally
brew install supabase/tap/supabase
brew install k6  # Load testing
npm install -g @lovable/cli  # If available

# GitHub Actions (copy to .github/workflows/)
# - ci.yml (lint + test on every PR)
# - deploy-staging.yml (auto-deploy staging branch)
# - deploy-prod.yml (manual trigger, main only)
```

### Supabase CLI Commands
```bash
# Link projects
supabase link --project-ref xuxfuonzsfvrirdwzddt  # prod
supabase link --project-ref yalls-staging          # staging

# Run migrations
supabase db push --db-url $STAGING_DB
supabase db diff --file new_migration.sql

# Test locally
supabase start  # Spin up local DB
supabase db reset  # Reset to clean state
```

## ⚠️ Risk Mitigation

### High-Risk Items
1. **Dual search migration**: Could break existing search if not careful
   - **Mitigation**: Feature flag `search_v2_enabled`, default off
   
2. **Tenant guard rollout**: 60+ functions to migrate
   - **Mitigation**: Migrate 5 functions/day, deploy incrementally
   
3. **Job queue**: Workers crash or get stuck
   - **Mitigation**: DLQ + auto-retry + manual queue drain script

4. **Rate limiting**: False positives lock out legitimate users
   - **Mitigation**: Start with generous limits, tune down gradually

### Rollback Plan
Every production deploy must have a rollback:
- **Code**: Revert Git commit + redeploy previous version
- **DB**: Keep old columns during expand phase (contract later)
- **Feature flags**: Kill switch to disable new features instantly

## 📊 Success Metrics

### Launch Criteria (All Must Be Green)
- [ ] Zero tenant isolation test failures
- [ ] P95 latency < 400ms across all endpoints
- [ ] Rate limit false positive rate < 0.1%
- [ ] Queue processing time < 30s for 95% of jobs
- [ ] Zero raw DB calls in production code
- [ ] All RLS policies verified
- [ ] Security audit passes with zero critical issues
- [ ] Load test: 1000 concurrent users, 99% success rate
- [ ] Runbooks written for top 10 incidents
- [ ] On-call rotation staffed

## 🎯 Ownership Matrix

| Stream | Primary Owner | Backup | Merge Frequency |
|--------|---------------|--------|-----------------|
| UI Polish | Frontend Dev | Designer | Daily |
| Tenant Security | Backend Dev | Security Eng | Every 5 functions |
| Search Isolation | ML Eng | Backend Dev | Major milestones |
| Job Queue | Infra Eng | Backend Dev | Per processor |
| Observability | DevOps | QA Eng | Continuous |

## 🚀 Getting Started (Next 24 Hours)

### Immediate Actions
1. **Create Supabase projects** (30 min)
   - Staging: Clone prod schema
   - Scratch: Minimal setup for testing
   
2. **Set up branches** (10 min)
   ```bash
   git checkout -b staging
   git push -u origin staging
   
   git checkout -b feature/ui-polish
   git checkout -b feature/tenant-security
   git checkout -b feature/search-isolation
   git checkout -b feature/job-queue
   git checkout -b feature/observability
   ```

3. **Assign owners** (15 min)
   - Post in Slack/Discord: "Who's taking which stream?"
   - Update this doc with names

4. **Wire env vars** (45 min)
   - Update CI/CD with branch-specific Supabase keys
   - Test deploy to staging

5. **Kick off work** (Day 1 afternoon)
   - Each stream starts with a 30min planning call
   - Daily standups at 9am (5min async Slack updates)

## 📚 Resources

- [Supabase Branching Guide](https://supabase.com/docs/guides/deployment/branching)
- [Expand-Migrate-Contract Pattern](https://www.tim-wellhausen.de/papers/ExpandAndContract.pdf)
- [k6 Load Testing](https://k6.io/docs/)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated**: 2025-10-21  
**Status**: Ready to execute  
**Next Review**: After Week 1 sprint
