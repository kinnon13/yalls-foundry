# 🛡️ Guard Flow - Architecture Enforcement System

Enterprise-grade protection against architectural degradation, unauthorized merges, and code consolidation.

## Overview

Guard Flow is a multi-layered enforcement system that ensures:
- ✅ All audit modules remain independent and modular
- ✅ Supabase functions are properly registered
- ✅ File structure integrity is maintained
- ✅ No unauthorized code merges or deletions
- ✅ CI/CD pipeline validates every commit

## Layers of Protection

### 1. Local Guards (Pre-commit Hooks)
Runs **before** every commit on developer machines.

```bash
# Automatically runs on git commit
git commit -m "your changes"
```

**Checks:**
- File structure verification
- Supabase config sync
- Module integrity

**Blocks:** Any commit that violates architectural rules.

### 2. GitHub Actions (CI Guards)
Runs on **every push** and **every pull request**.

**Checks:**
- All local guard checks
- Full audit scan (scan-only mode)
- Generates audit reports

**Blocks:** Merging of PRs that fail any check.

**Reports:** Uploads audit results as artifacts.

### 3. Branch Protection Rules
Enforced at the **GitHub repository** level.

**Required:**
1. Status checks must pass (Guard Flow CI)
2. Pull request reviews required
3. Code owner approval required (CODEOWNERS)

**Prevents:** Direct pushes to main, bypassing reviews.

### 4. Code Owners
Defined in `.github/CODEOWNERS`.

**Requires approval for:**
- `scripts/modules/` - All audit modules
- `scripts/master-elon-scan.ts` - Orchestrator
- `supabase/config.toml` - Function configuration
- `.github/workflows/` - CI definitions

## Setup Instructions

### Initial Setup

1. **Install Guard System:**
   ```bash
   chmod +x scripts/setup-guards.sh
   ./scripts/setup-guards.sh
   ```

2. **Update CODEOWNERS:**
   Edit `.github/CODEOWNERS` and replace `@owner` with your GitHub username.

3. **Configure Branch Protection:**
   - Go to GitHub repo → Settings → Branches
   - Add rule for `main` branch
   - Enable: "Require status checks to pass"
   - Select: "enforce-architecture" workflow
   - Enable: "Require pull request reviews"

4. **Test the System:**
   ```bash
   # Quick check
   ./scripts/guard-quick-check.sh
   
   # Full audit
   deno run -A scripts/master-elon-scan.ts
   ```

### Daily Usage

**Quick Architecture Check:**
```bash
npm run guard
# or
./scripts/guard-quick-check.sh
```

**Before Committing:**
```bash
# Guards run automatically on git commit
# But you can test manually:
deno run -A scripts/verify-structure.ts
deno run -A scripts/verify-supabase-config.ts
deno run -A scripts/verify-modules.ts
```

**Fix Issues:**
```bash
# Auto-fix config sync issues
deno run -A scripts/master-elon-scan.ts --fix
```

## What Gets Blocked

### ❌ Blocked Actions

1. **Merging modules into one file**
   - Guard: `verify-modules.ts`
   - Detection: File size > 50KB or module count < 11

2. **Deleting audit modules**
   - Guard: `verify-structure.ts`
   - Detection: Missing required files

3. **Unregistered Supabase functions**
   - Guard: `verify-supabase-config.ts`
   - Detection: Folder exists but no config entry

4. **Direct pushes to main**
   - Guard: Branch protection rules
   - Requires: Pull request + review

5. **Unapproved changes to core files**
   - Guard: CODEOWNERS
   - Requires: Code owner approval

### ✅ Allowed Actions

1. **Adding new audit modules**
   - Must follow naming convention
   - Must be in `scripts/modules/`
   - Update `verify-modules.ts` EXPECTED_MODULES

2. **Creating new Supabase functions**
   - Auto-sync with `--fix` flag
   - Or manually add to config.toml

3. **Refactoring within modules**
   - As long as file count/structure maintained
   - Module independence preserved

## Troubleshooting

### Pre-commit Hook Fails

**Symptom:** Commit is blocked locally.

**Solution:**
```bash
# Check what failed
./scripts/guard-quick-check.sh

# Fix issues
deno run -A scripts/master-elon-scan.ts --fix

# Try commit again
git commit -m "your message"
```

### GitHub Action Fails

**Symptom:** PR shows red X, "enforce-architecture" failed.

**Solution:**
1. Check the Actions tab for detailed logs
2. Run guards locally to reproduce
3. Fix issues and push again
4. Action will re-run automatically

### Module Count Mismatch

**Symptom:** `verify-modules.ts` reports wrong count.

**Cause:** Module was deleted or merged.

**Solution:**
```bash
# Restore from Git history
git log --all --full-history -- scripts/modules/

# Or if you added a new module, update verify-modules.ts:
# Add new module name to EXPECTED_MODULES array
```

### Supabase Config Orphans

**Symptom:** `verify-supabase-config.ts` shows orphans.

**Cause:** Function folder exists but not in config.toml.

**Solution:**
```bash
# Auto-fix
deno run -A scripts/modules/sync-config-from-folders.ts --fix

# Or manually add to supabase/config.toml:
[functions.your-function-name]
verify_jwt = false
```

## Files Overview

### Guard Scripts
- `scripts/verify-structure.ts` - File structure integrity
- `scripts/verify-supabase-config.ts` - Function registration sync
- `scripts/verify-modules.ts` - Module independence check

### Helper Scripts
- `scripts/setup-guards.sh` - One-time setup
- `scripts/guard-quick-check.sh` - Fast verification
- `.husky/pre-commit` - Git pre-commit hook

### CI/CD
- `.github/workflows/guard-flow.yml` - GitHub Actions workflow
- `.github/CODEOWNERS` - Approval requirements

## Best Practices

1. **Run guards before committing:**
   ```bash
   npm run guard
   ```

2. **Never bypass guards:**
   ```bash
   # DON'T DO THIS:
   git commit --no-verify
   ```

3. **Fix issues immediately:**
   ```bash
   # Don't accumulate violations
   deno run -A scripts/master-elon-scan.ts --fix
   ```

4. **Review audit reports:**
   ```bash
   # Check what changed
   cat scripts/audit/master-summary.json
   ```

5. **Keep guards updated:**
   - When adding modules, update `verify-modules.ts`
   - When adding functions, run sync script

## Emergency Override

**Only use if absolutely necessary (production incident, etc.):**

```bash
# Bypass pre-commit (NOT RECOMMENDED)
git commit --no-verify -m "EMERGENCY: reason"

# You'll still need approval for PR merge
# Code owners will review the emergency change
```

## Success Metrics

A healthy Guard Flow system shows:
- ✅ 0 orphaned functions
- ✅ 0 ghost configs
- ✅ 11 intact modules
- ✅ 12 required files present
- ✅ All CI checks passing

## Support

If guards are failing unexpectedly:

1. Check this README
2. Run `./scripts/guard-quick-check.sh` for details
3. Review GitHub Actions logs
4. Check audit reports in `scripts/audit/`

---

**Remember:** Guards exist to protect architecture, not to annoy developers. If a guard fails, there's usually a real issue that needs attention.
