# 🚀 Mission Control Stack v∞

Complete Y'all + Rocker audit and enforcement system.

## Architecture Overview

```
scripts/
│
├── guard/              PRE-FLIGHT LAYER
│   ├── verify-structure.ts
│   ├── verify-supabase-config.ts
│   └── verify-modules.ts
│
├── scan/               ANALYTICS + DETECTION LAYER
│   ├── find-dead-code.ts             ← Elite #1
│   ├── find-duplicate-docs.ts        ← Elite #2
│   ├── deep-duplicate-scan.ts
│   └── scan-cross-dependencies-v2.ts
│
├── audit/              INTEGRITY LAYER
│   ├── audit-functions.ts
│   └── sync-supabase-config.ts
│
├── health/             LIVE SYSTEM LAYER
│   ├── ping-functions.ts             ← Elite #3
│   └── verify-platform.ts
│
├── modules/            SHARED INTELLIGENCE
│   └── _utils.ts
│
└── master-elon-scan.ts    🎯 COMMAND CENTER
```

## Quick Start

### Run Complete Scan

```bash
deno run -A scripts/master-elon-scan.ts
```

### Run Individual Layers

```bash
# Guard layer (pre-flight)
deno run -A scripts/guard/verify-structure.ts
deno run -A scripts/guard/verify-supabase-config.ts
deno run -A scripts/guard/verify-modules.ts

# Scan layer (detection)
deno run -A scripts/scan/find-dead-code.ts
deno run -A scripts/scan/find-duplicate-docs.ts

# Audit layer (integrity)
deno run -A scripts/audit/audit-functions.ts
deno run -A scripts/audit/sync-supabase-config.ts

# Health layer (live)
deno run -A scripts/health/ping-functions.ts
deno run -A scripts/health/verify-platform.ts
```

## Layer Details

### 🛡️ GUARD Layer

**Purpose:** Architectural integrity enforcement

**When:** Pre-commit, CI/CD, manual checks

**Protects Against:**
- Missing critical files
- Unregistered functions
- Module consolidation
- Structure violations

**Scripts:**
- `verify-structure.ts` - File structure integrity
- `verify-supabase-config.ts` - Function registration
- `verify-modules.ts` - Module independence

### 🔍 SCAN Layer

**Purpose:** Code analysis and pattern detection

**When:** Full audits, code reviews

**Detects:**
- Unused exports (dead code)
- Duplicate documentation
- Function duplication patterns
- Cross-category dependencies

**Scripts:**
- `find-dead-code.ts` - Unused export detection
- `find-duplicate-docs.ts` - Document deduplication
- `deep-duplicate-scan.ts` - Duplicate function analysis
- `scan-cross-dependencies-v2.ts` - Dependency mapping

### 📊 AUDIT Layer

**Purpose:** Configuration synchronization

**When:** After function changes, regular maintenance

**Ensures:**
- Config matches actual folders
- All functions registered
- Orphans/ghosts identified

**Scripts:**
- `audit-functions.ts` - Function integrity
- `sync-supabase-config.ts` - Config sync

### 💚 HEALTH Layer

**Purpose:** Live system validation

**When:** Post-deployment, health checks

**Validates:**
- Platform file presence
- Edge function availability
- Response times
- Deployment status

**Scripts:**
- `verify-platform.ts` - Platform readiness
- `ping-functions.ts` - Live function health

## Output Reports

All scripts write JSON reports to `scripts/audit/`:

```
scripts/audit/
├── master-scan-summary.json       ← Overall results
├── dead-code-results.json         ← Unused exports
├── duplicate-docs-results.json    ← Doc duplicates
├── audit-results.json             ← Function audit
└── ping-results.json              ← Health checks
```

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "scan": "deno run -A scripts/master-elon-scan.ts",
    "guard": "deno run -A scripts/guard/verify-structure.ts && deno run -A scripts/guard/verify-supabase-config.ts && deno run -A scripts/guard/verify-modules.ts",
    "health": "deno run -A scripts/health/ping-functions.ts",
    "audit:dead": "deno run -A scripts/scan/find-dead-code.ts",
    "audit:docs": "deno run -A scripts/scan/find-duplicate-docs.ts"
  }
}
```

Usage:
```bash
npm run scan        # Full stack scan
npm run guard       # Quick integrity check
npm run health      # Live system check
npm run audit:dead  # Find dead code
npm run audit:docs  # Find duplicate docs
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/verify.yml`:

```yaml
- name: 🚀 Run Master Scan
  run: deno run -A scripts/master-elon-scan.ts

- name: 📦 Upload Audit Reports
  uses: actions/upload-artifact@v4
  with:
    name: audit-reports
    path: scripts/audit/
```

## Elite Features

### 🧠 Elite #1: Dead Code Detection

**What it does:** Scans for unused exports across the codebase

**Why it matters:** Reduces bundle size, improves maintainability

**Example output:**
```json
{
  "deadExports": [
    { "symbol": "unusedFunction", "file": "supabase/functions/old/index.ts" }
  ]
}
```

### 📄 Elite #2: Duplicate Docs Finder

**What it does:** Identifies identical documentation files by content hash

**Why it matters:** Eliminates stale docs, reduces confusion

**Example output:**
```json
{
  "duplicateGroups": [
    ["docs/api.md", "docs/old-api.md"]
  ]
}
```

### 💚 Elite #3: Live Function Ping

**What it does:** Tests all Edge Functions for availability

**Why it matters:** Validates deployment, catches dead endpoints

**Example output:**
```json
{
  "summary": {
    "successful": 45,
    "failed": 2,
    "avgResponseTime": 127
  }
}
```

## Troubleshooting

### SUPABASE_URL Not Set

**Symptom:** `ping-functions.ts` fails

**Solution:**
```bash
# Set environment variable
export SUPABASE_URL=https://your-project.supabase.co

# Or add to .env
SUPABASE_URL=https://your-project.supabase.co
```

### Guard Scripts Fail

**Symptom:** Pre-commit blocked

**Solution:**
```bash
# Run guards to see what failed
npm run guard

# Fix issues
deno run -A scripts/modules/sync-config-from-folders.ts --fix

# Retry commit
git commit -m "your message"
```

### Dead Code False Positives

**Symptom:** Functions marked as dead but are actually used

**Solution:**
- Review `scripts/audit/dead-code-results.json`
- Check if function is dynamically imported
- Verify it's not an API endpoint handler
- Update scan logic if needed

## Best Practices

1. **Run before commits:**
   ```bash
   npm run guard
   ```

2. **Full audit weekly:**
   ```bash
   npm run scan
   ```

3. **Health checks post-deployment:**
   ```bash
   npm run health
   ```

4. **Review reports:**
   ```bash
   cat scripts/audit/master-scan-summary.json | jq
   ```

5. **Clean up dead code:**
   ```bash
   npm run audit:dead
   # Review output, then remove unused exports
   ```

## Success Metrics

Healthy system indicators:

- ✅ All guard scripts pass
- ✅ Zero orphaned functions
- ✅ Zero ghost configs
- ✅ < 5% dead code
- ✅ < 3 duplicate doc groups
- ✅ 100% function health
- ✅ < 200ms avg response time

## Extension Points

### Add Custom Scans

Create new scanner in `scripts/scan/`:

```typescript
#!/usr/bin/env -S deno run -A
// Custom scanner
import { writeJSON } from "../modules/_utils.ts";

// Your scan logic here

await writeJSON("scripts/audit/custom-scan.json", results);
```

Then add to `master-elon-scan.ts`.

### Dashboard Integration

Parse JSON reports for admin panel:

```typescript
const deadCode = await fetch('/scripts/audit/dead-code-results.json');
const health = await fetch('/scripts/audit/ping-results.json');

// Render traffic light indicators
```

## Support

- **Documentation:** See individual README.md files in each layer
- **Setup Guide:** `SETUP_INSTRUCTIONS.md`
- **Guard Flow:** `GUARD_FLOW_README.md`
- **Issues:** Review audit JSON files for specifics

---

**Remember:** This system is designed to be Elon-grade × 20%. Every layer serves a purpose. Don't bypass guards, don't skip scans, don't ignore health checks.
