# 🚀 Guard Flow Setup Instructions

Complete setup guide for the architectural enforcement system.

## Prerequisites

- ✅ Deno installed (`curl -fsSL https://deno.land/install.sh | sh`)
- ✅ Node.js installed (for Husky pre-commit hooks)
- ✅ Git repository initialized
- ✅ GitHub repository connected

## Quick Setup (5 minutes)

### Step 1: Install Husky

```bash
npm install husky --save-dev
npx husky install
```

### Step 2: Make Scripts Executable

```bash
chmod +x scripts/setup-guards.sh
chmod +x scripts/guard-quick-check.sh
chmod +x .husky/pre-commit
```

### Step 3: Run Setup Script

```bash
./scripts/setup-guards.sh
```

This will:
- Verify Deno and Node.js installations
- Initialize Husky hooks
- Test all guard scripts
- Report success/failure

### Step 4: Add NPM Scripts

Add these to your `package.json` under `"scripts"`:

```json
{
  "scripts": {
    "guard": "deno run -A scripts/verify-structure.ts && deno run -A scripts/verify-supabase-config.ts && deno run -A scripts/verify-modules.ts",
    "guard:fix": "deno run -A scripts/master-elon-scan.ts --fix",
    "audit": "deno run -A scripts/master-elon-scan.ts",
    "audit:fix": "deno run -A scripts/master-elon-scan.ts --fix"
  }
}
```

Then you can use:
```bash
npm run guard       # Quick check
npm run guard:fix   # Fix issues
npm run audit       # Full audit scan
npm run audit:fix   # Full audit + auto-fix
```

### Step 5: Configure GitHub (Important!)

#### A. Update CODEOWNERS

Edit `.github/CODEOWNERS` and replace `@owner` with your GitHub username:

```
/scripts/modules/ @your-github-username
/scripts/master-elon-scan.ts @your-github-username
```

#### B. Enable Branch Protection

1. Go to your GitHub repository
2. Settings → Branches
3. Add rule for branch: `main` (or `master`)
4. Configure these settings:

**Required:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Status checks: Select `enforce-architecture`

**Recommended:**
- ✅ Require pull request reviews before merging
- ✅ Require approval from code owners
- ✅ Dismiss stale pull request approvals when new commits are pushed

5. Save changes

## Verification

### Test Local Guards

```bash
# Quick check
./scripts/guard-quick-check.sh

# Individual checks
deno run -A scripts/verify-structure.ts
deno run -A scripts/verify-supabase-config.ts
deno run -A scripts/verify-modules.ts
```

Expected output:
```
✅ STRUCTURE GUARD PASSED
✅ SUPABASE CONFIG GUARD PASSED
✅ MODULE INTEGRITY GUARD PASSED
```

### Test Pre-commit Hook

```bash
# Make a dummy change
echo "# Test" >> README.md

# Try to commit (guards will run)
git add README.md
git commit -m "test: verify guards"

# You should see:
# 🛡️ Guard Flow: Pre-commit Architecture Check
# ... verification output ...
# ✅ Guard Flow passed - commit allowed
```

### Test CI Pipeline

1. Push your changes to GitHub
2. Go to Actions tab
3. You should see "Guard Flow - Architecture Enforcement" workflow
4. It should show green checkmark ✅

## Usage

### Daily Development

**Before starting work:**
```bash
npm run guard  # Verify current state
```

**Before committing:**
```bash
# Guards run automatically, but you can test:
./scripts/guard-quick-check.sh
```

**If something breaks:**
```bash
npm run guard:fix  # Auto-fix issues
```

**Full audit:**
```bash
npm run audit      # Scan only
npm run audit:fix  # Scan + fix
```

### What Gets Checked

**Every Commit (Local):**
- File structure integrity
- Supabase function registration
- Module independence

**Every Push (GitHub):**
- All local checks
- Full audit scan
- Report generation

**Every PR Merge:**
- All push checks
- Code owner approval
- Branch protection rules

## Troubleshooting

### "Husky command not found"

```bash
npm install husky --save-dev
npx husky install
```

### "Deno command not found"

```bash
curl -fsSL https://deno.land/install.sh | sh
# Then restart your terminal
```

### Pre-commit Hook Not Running

```bash
# Reinstall hooks
npx husky install
chmod +x .husky/pre-commit

# Test manually
./.husky/pre-commit
```

### CI Fails But Local Passes

1. Check GitHub Actions logs for details
2. Ensure all files are committed
3. Verify CI has access to all scripts
4. Check for environment differences

### "Permission denied" Errors

```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x .husky/pre-commit
```

## Optional: Slack/Discord Notifications

Add to `.github/workflows/guard-flow.yml` after the "Block on Guard Failure" step:

```yaml
- name: Notify Slack on Failure
  if: failure()
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 Guard Flow failed on commit ${{ github.sha }}"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

Then add `SLACK_WEBHOOK_URL` as a repository secret:
1. GitHub → Settings → Secrets → Actions
2. New repository secret
3. Name: `SLACK_WEBHOOK_URL`
4. Value: Your Slack webhook URL

## Success Checklist

- [ ] Husky installed and initialized
- [ ] Scripts are executable (`chmod +x`)
- [ ] NPM scripts added to package.json
- [ ] CODEOWNERS updated with your username
- [ ] Branch protection rules configured on GitHub
- [ ] Local guards pass (`./scripts/guard-quick-check.sh`)
- [ ] Pre-commit hook works (test with dummy commit)
- [ ] CI workflow is green on GitHub Actions
- [ ] Can view audit reports as artifacts

## Next Steps

Once setup is complete:

1. **Read:** `GUARD_FLOW_README.md` for detailed usage
2. **Test:** Make a PR to verify full flow
3. **Document:** Add guard commands to team documentation
4. **Train:** Ensure team knows how to fix guard failures

## Emergency Bypass (Use Sparingly!)

If you absolutely must bypass guards (production emergency):

```bash
# Local bypass (NOT RECOMMENDED)
git commit --no-verify -m "EMERGENCY: description"

# You'll still need:
# - PR approval
# - Code owner review
# - CI to pass on merge
```

**Note:** This should only be used for genuine emergencies. All bypassed commits should be reviewed afterward.

## Support

If you encounter issues:

1. Check `GUARD_FLOW_README.md`
2. Run `./scripts/guard-quick-check.sh` for diagnostics
3. Check GitHub Actions logs
4. Review audit reports in `scripts/audit/`

---

**Questions?** Check the documentation or examine the guard scripts themselves - they're well-commented and straightforward.
