# Development Process Documentation

**Last Updated:** 2025-10-22

## Purpose

This directory contains workflows, branching strategies, and development protocols that govern how code changes flow from concept to production.

## Contents

### Branching & Deployment

- **[BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md)**
  - Multi-stream parallel development workflow
  - Migration train coordination for database changes
  - Environment split (production/staging/scratch)
  - CI/CD gates and deployment procedures
  - 2-week sprint timeline with role assignments

- **[SOLO_WORKFLOW.md](./SOLO_WORKFLOW.md)**
  - Simplified workflow for solo developers
  - Multi-device branch management
  - Device switching without conflicts
  - Self-review and merge procedures

## Core Workflows

### Feature Development
1. Create feature branch from `staging`
2. Implement with tests and documentation
3. Open PR targeting `staging` (not `main`)
4. Pass CI checks (lint, type, security)
5. Merge to `staging`

### Database Changes
1. Create migration on `train/db-YYYYMMDD` branch
2. Pass scratch-DB smoke tests
3. Merge train to `staging`
4. Verify on staging environment
5. Include in next release

### Production Deployment
1. Staging bakes 24-48h (no new commits)
2. Cut `release/YYYY-MM-DD` from staging
3. Canary deploy (10% → 50% → 100%)
4. Merge release to `main`
5. Tag version (`v1.2.3`)

## Branch Model

```
main (protected, production)
├── release/YYYY-MM-DD (canary deploys)
├── staging (daily integration)
│   ├── train/db-YYYYMMDD (DB coordination)
│   ├── feature/ui-polish
│   ├── feature/tenant-security
│   ├── feature/search-isolation
│   ├── feature/job-queue
│   └── feature/observability
```

## Guardrails

### 1. Migration Train
**Problem**: Concurrent DB changes cause conflicts  
**Solution**: All DB PRs merge to temporary train branch first

**Process**:
- Create daily train: `train/db-YYYYMMDD`
- All DB PRs target train (not staging)
- CI smoke tests on scratch DB
- Fast-forward merge train → staging when green

### 2. Release Branches (Not Cherry-Picks)
**Problem**: Cherry-picking drifts history  
**Solution**: Cut release branch from staging, deploy it, merge to main

**Process**:
- Cut: `git checkout -b release/YYYY-MM-DD staging`
- Deploy canary (monitor at each percentage)
- Merge to `main` if successful
- Tag: `git tag v1.2.3`

### 3. CODEOWNERS + CI Gates
**Problem**: Risky changes merge without review  
**Solution**: Mandatory reviews on critical paths

**Protected paths**:
- `supabase/migrations/**` - Requires infra + security
- `supabase/functions/_shared/**` - Requires infra
- `scripts/audit/**` - Requires security team
- `.github/workflows/**` - Requires infra lead

## Environment Management

### Three Environments

| Project | Branch | Purpose | DB Changes? |
|---------|--------|---------|-------------|
| Production | `main` | Live users | Baked migrations only |
| Staging | `staging` + PRs | Integration testing | Yes, with approval |
| Scratch | Risky features | Throwaway testing | Yes, anything |

### Environment Variables

Each environment has separate Supabase project:

```bash
# Production (main)
SUPABASE_URL=[PRODUCTION_URL]
SUPABASE_ANON_KEY=[PRODUCTION_ANON_KEY]

# Staging (staging + PRs)
SUPABASE_URL=[STAGING_URL]
SUPABASE_ANON_KEY=[STAGING_ANON_KEY]

# Scratch (experimental)
SUPABASE_URL=[SCRATCH_URL]
SUPABASE_ANON_KEY=[SCRATCH_ANON_KEY]
```

## CI/CD Pipeline

### Pre-Merge Checks
Every PR must pass:

```bash
# Code quality
npm run lint
npm run typecheck

# Security audits  
./scripts/audit/check-tenant-guards.sh
./scripts/audit/verify-rls.sh

# Tests
npm run test:unit
npm run test:integration
```

### Deployment Flow

```
feature/* → staging (continuous, flags OFF)
         ↓
migrations → train/db-* → staging (after CI green)
         ↓
staging bakes 24-48h
         ↓
release/YYYY-MM-DD (canary deploy)
         ↓
main (production)
```

## Team Coordination

### For Solo Developers
Use [SOLO_WORKFLOW.md](./SOLO_WORKFLOW.md):
- One branch per device
- Push frequently
- Self-review with checklist
- Skip mandatory reviews (but keep CI)

### For Teams
Use [BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md):
- Assign streams to specialists
- Daily integration to staging
- CODEOWNERS enforce reviews
- Coordination via migration trains

## Risk Mitigation

### Rollback Plan
Every production deploy needs rollback capability:

**Code rollback**:
```bash
git revert <commit-sha>
git push origin main
```

**DB rollback**:
- Keep old columns during expand phase
- Contract after full rollout
- Maintain migration rollback scripts

**Feature flags**:
- Kill switch for new features
- No code deploy needed
- Instant disable if issues arise

## Common Scenarios

### "I broke staging"
```bash
git checkout staging
git pull --ff-only
git log --oneline -5
git revert -m 1 <bad-merge-sha>
git push origin staging
```

### "My migration conflicts with train"
```bash
# Rebase your branch on latest train
git fetch origin
git checkout feature/my-db-change
git rebase origin/train/db-YYYYMMDD
# Resolve conflicts
git push --force-with-lease
```

### "Need to hotfix production"
```bash
# Create hotfix from main
git checkout -b hotfix/critical-bug main
# Fix, test, commit
git push -u origin hotfix/critical-bug
# PR to main (skip staging)
```

## Tools & Commands

### Quick Bootstrap
```bash
# Set up device for work
./scripts/bootstrap-device.sh feature/ui-polish
```

### Supabase CLI
```bash
# Link to staging
supabase link --project-ref [STAGING_REF]

# Apply migrations locally
supabase db reset

# Generate new migration
supabase db diff --file new_migration.sql
```

### GitHub CLI
```bash
# Create PR
gh pr create --base staging --fill

# Merge PR
gh pr merge --squash
```

## Related Documentation

- [Architecture Decisions](../architecture/10-SECTION-LOCKDOWN.md)
- [Production Readiness](../production/PRODUCTION_HARDENING.md)
- [Audit Scripts](../../scripts/audit/README.md)
- [Project Rules](../../PROJECT_RULES.md)

---

**Last Updated:** 2025-10-22
