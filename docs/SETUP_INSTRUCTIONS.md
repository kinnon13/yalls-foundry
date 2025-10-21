# Setup Instructions for 7-Branch Parallel Development

## 🎯 Quick Start

### Step 1: Create All Branches (5 minutes)

Run the setup script:

```bash
# Set your remote name (usually 'origin' or 'loveable')
export REMOTE=origin

# Run setup
chmod +x scripts/setup-branches.sh
./scripts/setup-branches.sh
```

This creates:
- `staging` - Integration branch
- `feature/ui-polish` - UI/UX work
- `feature/tenant-security` - RLS & tenant guards
- `feature/search-isolation` - Dual search indices
- `feature/job-queue` - Workers & async jobs
- `feature/observability` - Tests & monitoring

### Step 2: Protect Branches on GitHub (10 minutes)

Go to **GitHub → Settings → Branches → Add rule**

#### Protect `main`:
```
Branch name pattern: main
☑ Require pull request reviews before merging (2 approvals)
☑ Require status checks to pass before merging
  - typecheck-and-lint
  - security-check
  - integration-tests
☑ Require branches to be up to date before merging
☑ Do not allow bypassing the above settings
☑ Restrict who can push to matching branches
```

#### Protect `staging`:
```
Branch name pattern: staging
☑ Require status checks to pass before merging
  - typecheck-and-lint
  - security-check
☑ Allow force pushes (for cleanup)
```

#### Protect `release/**`:
```
Branch name pattern: release/**
☑ Require pull request reviews before merging (2 approvals)
☑ Require status checks to pass before merging
☑ Do not allow bypassing the above settings
```

### Step 3: Configure GitHub Secrets (5 minutes)

Go to **GitHub → Settings → Secrets and variables → Actions**

Add these secrets:
- `STAGING_SUPABASE_URL` - Your staging Supabase project URL
- `STAGING_SUPABASE_ANON_KEY` - Staging anon key
- `STAGING_DB_URL` - Staging PostgreSQL connection string
- `TRAIN_DB_URL` - Scratch DB for train branch testing (optional)

### Step 4: Assign Owners (5 minutes)

Update `.github/CODEOWNERS` with real GitHub usernames:

```bash
# Replace placeholders with real usernames
sed -i 's/@infra-lead/@your-username/g' .github/CODEOWNERS
sed -i 's/@security-team/@security-user/g' .github/CODEOWNERS
sed -i 's/@backend-lead/@backend-user/g' .github/CODEOWNERS
sed -i 's/@tech-lead/@tech-user/g' .github/CODEOWNERS

git add .github/CODEOWNERS
git commit -m "Configure CODEOWNERS"
git push origin main
```

---

## 📋 Daily Workflow

### Working on a Feature Branch

```bash
# Start your day
git checkout feature/ui-polish
git fetch origin
git rebase origin/staging  # Keep up with integration changes

# Do your work
git add -A
git commit -m "UI: add voice waveform animation"
git push

# Open PR on GitHub: base=staging
```

### Merging to Staging

Once PR is approved and CI is green:
1. GitHub automatically merges to `staging`
2. Staging deploys automatically
3. Watch for issues in staging environment

---

## 🚂 Migration Train Workflow

When you have DB changes:

### Step 1: Create Today's Train

```bash
chmod +x scripts/create-train.sh
./scripts/create-train.sh
```

This creates `train/db-YYYYMMDD` from staging.

### Step 2: Open PR to Train

```bash
git checkout feature/tenant-security
# Make your migration changes
git add supabase/migrations/...
git commit -m "Migration: add org_id to voice_events"
git push

# On GitHub: Open PR with base=train/db-YYYYMMDD
# Add label: "db-change"
```

### Step 3: Train CI Validates

CI will:
- Spin up scratch DB
- Apply all migrations
- Run RLS verification
- Run tenant isolation tests

### Step 4: Merge Train to Staging

Once all DB PRs are in train and CI is green:

```bash
git checkout staging
git merge --no-ff train/db-$(date +%Y%m%d)
git push origin staging

# Delete train
git push origin :train/db-$(date +%Y%m%d)
git branch -d train/db-$(date +%Y%m%d)
```

---

## 🚀 Release Process

### Step 1: Let Staging Bake

- Wait 24-48 hours after last staging commit
- Verify all tests green
- Check staging environment is stable

### Step 2: Create Release Branch

```bash
chmod +x scripts/create-release.sh
./scripts/create-release.sh
```

This creates `release/YYYY-MM-DD` from staging.

### Step 3: Open PR to Main

On GitHub:
- Open PR: `release/YYYY-MM-DD` → `main`
- Get 2 approvals (including infra/security)
- CI must be green

### Step 4: Canary Deploy

Deploy to production gradually:
1. **10% traffic** → monitor for 2 hours
   - Check error rates, latency, user reports
2. **50% traffic** → monitor for 4 hours
   - Verify metrics are stable
3. **100% rollout** → full production

### Step 5: Merge & Tag

```bash
git checkout main
git merge --no-ff release/YYYY-MM-DD
git tag -a v1.2.3 -m "Release Oct 24, 2025"
git push origin main --tags
```

---

## 🔧 Useful Commands

### Check Your Remote

```bash
git remote -v
```

Common names: `origin`, `loveable`

### See What's New on Staging

```bash
git fetch origin
git log --oneline origin/main..origin/staging
```

### Find Your Current Branch

```bash
git branch
```

### Switch Branches

```bash
git checkout feature/ui-polish
```

### Keep Feature Branch Updated

```bash
git fetch origin
git rebase origin/staging
# If conflicts, resolve then:
git rebase --continue
```

### Force Push After Rebase

```bash
git push --force-with-lease
```

---

## 🆘 Troubleshooting

### "Branch already exists"

```bash
# Delete local branch
git branch -D feature/ui-polish

# Recreate from origin
git checkout -b feature/ui-polish origin/feature/ui-polish
```

### "Merge Conflict"

```bash
# See conflicted files
git status

# Edit files to resolve conflicts
# Then:
git add .
git rebase --continue  # (or git merge --continue)
```

### "CI Failed"

Check the GitHub Actions tab for details:
- Click on failed check
- Read error messages
- Fix issues locally
- Push again

### "Can't Push to Protected Branch"

Protected branches (`main`, `staging`) require PRs. Never push directly.

```bash
# If you accidentally committed to main:
git checkout -b feature/fix-thing main
git push -u origin feature/fix-thing
# Open PR on GitHub

# Reset local main
git checkout main
git reset --hard origin/main
```

---

## 📚 Additional Resources

- **Branching Strategy**: See `docs/BRANCHING_STRATEGY.md`
- **Task Checklists**: See `docs/BRANCH_CHECKLISTS.md`
- **Production Hardening**: See `docs/PRODUCTION_HARDENING.md`
- **Work Breakdown**: See `docs/WORK_BREAKDOWN.md`

---

## ✅ Setup Checklist

Before starting work, verify:

- [ ] All 7 branches created and pushed
- [ ] `main` and `staging` protected on GitHub
- [ ] `.github/CODEOWNERS` configured with real usernames
- [ ] GitHub secrets configured (Supabase URLs/keys)
- [ ] CI workflow enabled (`.github/workflows/ci.yml`)
- [ ] Team assigned to feature branches
- [ ] Daily standup scheduled (9am, async in Slack)
- [ ] Monitoring/alerts configured (optional but recommended)

---

**Last Updated**: 2025-10-21  
**Next Review**: After first sprint (1 week)
