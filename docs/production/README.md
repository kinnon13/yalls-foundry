# Production Operations Documentation

**Last Updated:** 2025-10-22

## Purpose

This directory contains deployment procedures, hardening checklists, operational runbooks, and readiness criteria for production environments.

## Contents

### Hardening & Security

- **[PRODUCTION_HARDENING.md](./PRODUCTION_HARDENING.md)**
  - Tenant isolation and blast radius control
  - Dual search architecture (private vs marketplace)
  - Job queue patterns for async operations
  - Rate limiting per-organization
  - Acceptance criteria for production readiness
  - Migration status tracking

## Production Readiness Checklist

### P0: Tenant Isolation
- ✅ All edge functions use `withTenantGuard`
- ✅ RLS policies on all user-facing tables
- ✅ Org-scoped queries enforced
- ✅ CI blocks raw DB calls without org context
- ✅ Tenant isolation tests pass

### P1: Scalability
- ✅ Heavy operations use job queue
- ✅ Per-org concurrency limits enforced
- ✅ Rate limiting on expensive endpoints (TTS, embeddings, crawl)
- ✅ Dual search indices (private/marketplace)
- ✅ No N+1 queries in critical paths

### P2: Observability
- ✅ Structured logging with `request_id`, `org_id`, `actor_role`
- ✅ Metrics dashboards (P50/P95/P99 latency, queue depth)
- ✅ Alerts configured (latency, errors, queue backlog)
- ✅ Runbooks for common incidents
- ✅ On-call rotation staffed

### P3: Reliability
- ✅ Idempotency keys on critical operations
- ✅ Retry logic with exponential backoff
- ✅ Dead letter queue for failed jobs
- ✅ Circuit breakers on external APIs
- ✅ Graceful degradation patterns

## Deployment Procedures

### Standard Release (Weekly)
```bash
# 1. Verify staging is stable (24-48h green)
git fetch origin
git checkout -b release/$(date +%Y-%m-%d) origin/staging

# 2. Push release branch
git push -u origin release/$(date +%Y-%m-%d)

# 3. Open PR to main
gh pr create --base main --head release/$(date +%Y-%m-%d)

# 4. Canary deploy
# - 10% traffic → monitor 2h
# - 50% traffic → monitor 4h  
# - 100% rollout

# 5. Merge and tag
gh pr merge --merge
git tag v1.$(date +%V).0
git push --tags
```

### Hotfix Procedure
```bash
# 1. Branch from main
git checkout -b hotfix/critical-issue main

# 2. Fix, test, commit
git add -A
git commit -m "hotfix: describe issue and fix"

# 3. Direct PR to main (bypass staging)
gh pr create --base main --head hotfix/critical-issue --label hotfix

# 4. Fast-track review and merge
# 5. Cherry-pick to staging
git checkout staging
git cherry-pick <hotfix-commit-sha>
git push origin staging
```

### Rollback Procedure
```bash
# Code rollback
git revert <bad-commit-sha>
git push origin main

# Database rollback (if schema changed)
# Run down-migration script
psql $PROD_DB -f supabase/migrations/rollback/YYYYMMDDHHMMSS.sql

# Feature flag kill switch
# Via admin UI or direct DB update
UPDATE feature_flags SET enabled = false WHERE key = 'problematic-feature';
```

## Infrastructure

### Supabase Projects

| Environment | Project ID | Purpose |
|-------------|------------|---------|
| Production | `[PROD_ID]` | Live user traffic |
| Staging | `[STAGING_ID]` | Pre-production testing |
| Scratch | `[SCRATCH_ID]` | Experimental features |

### External Services

| Service | Purpose | Rate Limits | Fallback |
|---------|---------|-------------|----------|
| OpenAI | Embeddings, chat | Per-org quotas | Queue + retry |
| ElevenLabs | TTS | Per-org credits | Graceful skip |
| Stripe | Payments | Standard | Cache + retry |

## Monitoring & Alerts

### Key Metrics

**Latency**:
- P50 < 100ms (target)
- P95 < 400ms (SLA)
- P99 < 1000ms (acceptable)

**Error Rate**:
- Overall < 0.5% (target)
- Per-endpoint < 1% (SLA)
- Critical paths < 0.1% (required)

**Queue Health**:
- Depth < 100 per org (normal)
- Depth < 1000 per org (warning)
- Processing time P95 < 30s (SLA)

### Alert Thresholds

```yaml
critical:
  - P95 latency > 1000ms for 5min
  - Error rate > 5% for 5min
  - Queue depth > 5000 for 10min
  
warning:
  - P95 latency > 500ms for 10min
  - Error rate > 1% for 10min
  - Queue depth > 1000 for 15min
  - DLQ size > 50

info:
  - New deploy started
  - Canary percentage increased
  - Feature flag changed
```

## Runbooks

### TTS Service Outage
1. Check ElevenLabs status page
2. Switch to fallback provider (if configured)
3. Enable graceful degradation (skip TTS, text-only responses)
4. Notify users via banner
5. Monitor queue for backlog

### Database Connection Pool Exhausted
1. Check active connection count
2. Identify long-running queries
3. Kill hanging transactions if safe
4. Increase pool size temporarily
5. Review query patterns causing issue

### High Queue Backlog
1. Check worker health (is it processing?)
2. Verify per-org concurrency limits not too restrictive
3. Scale workers horizontally if needed
4. Identify orgs with abnormal job volume
5. Apply temporary rate limits if abuse detected

### Security Incident
1. Assess scope (which org, what data)
2. Isolate affected resources
3. Revoke compromised credentials
4. Notify affected users if required
5. Post-mortem and patch

## Capacity Planning

### Current Limits (Per Org)

| Resource | Limit | Reasoning |
|----------|-------|-----------|
| API requests | 10,000/min | Prevent noisy neighbor |
| TTS requests | 600/min | Service limits |
| Embeddings | 1000/min | Cost control |
| Crawl jobs | 100/hour | Respectful scraping |
| Storage | 10 GB | Generous default |

### Scaling Triggers

**Scale workers** when:
- Queue depth consistently > 500
- Processing time P95 > 60s
- DLQ accumulating (> 100 jobs)

**Upgrade DB** when:
- Connection pool > 80% used
- CPU > 70% sustained
- Storage > 80% used

## Testing

### Load Testing
```bash
# Run k6 scenarios
k6 run tests/load/standard-mix.js
k6 run tests/load/noisy-neighbor.js
k6 run tests/load/spike.js
```

### Chaos Engineering
- Random pod termination
- Database failover simulation
- Network partition testing
- External service outage simulation

### Security Testing
```bash
# RLS verification
./scripts/audit/verify-rls.sh

# Tenant isolation
npm run test:integration

# SSRF prevention
npm run test:security
```

## Related Documentation

- [Branching Strategy](../processes/BRANCHING_STRATEGY.md) - Release coordination
- [Architecture](../architecture/10-SECTION-LOCKDOWN.md) - System design
- [Audit Reports](../audit/README.md) - Security findings
- [Scripts](../../scripts/README.md) - Automation tools

---

**Last Updated:** 2025-10-22
