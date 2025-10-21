# Solo Multi-Device Workflow

Since you own all devices and work solo, here's the simplified version:

## Device Assignment (Example)

| Device   | Branch                    | Focus                          |
|----------|---------------------------|--------------------------------|
| Laptop   | feature/ui-polish         | UI, responsive, dark mode      |
| iMac     | feature/tenant-security   | RLS, guards, rate limits       |
| Mac Mini | feature/search-isolation  | Search, private vs public      |
| PC       | feature/job-queue         | Workers, async processing      |
| iPad     | staging (review only)     | PR reviews, merges             |

## Golden Rules

1. **One branch per device at a time** - don't edit the same branch on two devices simultaneously
2. **Always pull before starting**: `git fetch && git switch <branch> && git pull --rebase`
3. **Always push when done**: `git add -A && git commit -m "msg" && git push`
4. **All PRs target staging** (not main directly)

## Daily Workflow

```bash
# Start work on any device
git fetch --all --prune
git switch feature/ui-polish     # your device's branch
git pull --rebase

# Work... then save & push
git add -A
git commit -m "ui: fix responsive layout"
git push

# Open PR to staging (if ready)
gh pr create --base staging --fill
```

## Simplified Branch Protection (Solo)

Since you're solo, you can skip mandatory reviews but keep CI checks:

### GitHub Settings → Branches → Add Rule

**For `main`:**
- ✅ Require status checks (CI must pass)
- ✅ Require branches to be up to date
- ❌ Skip "Require pull request reviews" (you're solo)
- ✅ Require linear history
- ✅ Block force pushes

**For `staging`:**
- ✅ Require status checks (CI must pass)
- ❌ Skip review requirements
- ✅ Block force pushes

**For `release/*`:**
- ✅ Require status checks
- ✅ Require linear history

## Switching Devices Mid-Task

If you need to switch devices on the same branch:

```bash
# On Device A (pause work)
git add -A
git commit -m "WIP: partial work"
git push

# On Device B (continue)
git fetch
git switch feature/ui-polish
git pull --rebase
# continue work...
```

## Quick Bootstrap Script

Save as `scripts/bootstrap-device.sh`:

```bash
#!/bin/bash
set -e
BRANCH="${1:-feature/ui-polish}"

git fetch --all --prune
git switch "$BRANCH" 2>/dev/null || git switch -c "$BRANCH" origin/"$BRANCH" 2>/dev/null || git switch -c "$BRANCH" main
git pull --rebase || true
echo "✅ Ready on $BRANCH"
```

Run: `./scripts/bootstrap-device.sh feature/tenant-security`

## CODEOWNERS (Optional for Solo)

You can skip CODEOWNERS entirely OR use it as documentation:

```
# .github/CODEOWNERS (documentation only, no enforcement needed)
supabase/migrations/**            # DB changes - extra care
supabase/functions/_shared/**     # Shared utilities - review twice
supabase/functions/**/index.ts    # Edge functions - test thoroughly
```

## Merge to Production (Weekly)

```bash
# After staging bakes 24-48h
git fetch origin
git checkout -b release/$(date +%Y-%m-%d) origin/staging
git push -u origin release/$(date +%Y-%m-%d)

# Open PR: release/* → main
gh pr create --base main --head release/$(date +%Y-%m-%d) --fill

# After canary deploy succeeds
gh pr merge --merge
```

## Panic Button (Undo Bad Merge)

```bash
git checkout staging
git pull --ff-only
git log --oneline -5    # find the bad merge SHA
git revert -m 1 <bad_merge_sha>
git push origin staging
```
