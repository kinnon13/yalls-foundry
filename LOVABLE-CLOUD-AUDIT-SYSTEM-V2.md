# 🚀 Lovable Cloud Function Audit System v2 - ROLE-AWARE EDITION

**Complete automation suite for Supabase Edge Function management with multi-role feature detection**

---

## 🆕 What's New in v2

### Role-Aware Architecture Detection
- **Multi-Role Feature Overlap**: Detects when the same feature (e.g., "tasks", "messaging") is implemented across multiple roles
- **Smart Router Recommendations**: Auto-suggests unified routers for shared features
- **Category Bridges**: Identifies cross-category dependencies and generates bridge functions
- **Duplicate Detection**: Finds underscore vs hyphen variants

### Three-Dimensional Analysis
1. **Technical Categories** (andy, rocker, business, system, etc.)
2. **User Roles** (super_andy, rocker_admin, rocker_user, system_admin)
3. **Feature Names** (tasks, messaging, analytics, etc.)

---

## 📋 Complete Tool Suite

### Core Audit Scripts

**1. `scripts/verify-platform.ts`**
- Checks critical files (config.toml, functions/, src/)
- Soft-warns on optional files (.env is Lovable-managed)
- Only fails on critical missing files

**2. `scripts/sync-supabase-config.ts`**
- Additive-only (preserves all existing configs)
- Auto-adds missing function folders
- Defaults new entries to `verify_jwt = false`

**3. `scripts/audit-functions.ts`**
- Basic audit: folders vs config entries
- Detects ghosts and orphans
- Warns but doesn't block deployment

**4. `scripts/scan-cross-dependencies-v2.ts`** ⭐ NEW
- **Part 1**: Duplicate detection (underscore vs hyphen)
- **Part 2**: Cross-category dependency scanning
- **Part 3**: Multi-role feature overlap analysis
- Recommends both bridges and routers

**5. `scripts/restore-ghost-functions.ts`**
- Restores ghost functions as working stubs
- Creates placeholder implementations
- Manual use only (not automatic)

**6. `scripts/generate-bridges.ts`** ⭐ UPDATED
- Creates category bridges for cross-category calls
- Creates feature routers for multi-role features
- Auto-generates proper auth and routing logic

**7. `scripts/cleanup-duplicates.ts`** ⭐ NEW
- Auto-removes duplicate config entries
- Keeps hyphenated versions by default
- Preserves functions with folders

**8. `scripts/ai_audit.sh`** ⭐ UPDATED
- One-command full audit (v2)
- Runs all 4 core checks
- Provides actionable next steps

**9. `scripts/verify-install.ts`**
- Quick verification of audit system
- Checks all required files exist
- Parses and displays audit results

---

## 🎯 Usage Guide

### Quick Start

```bash
# Run complete audit (v2 with role awareness)
bash scripts/ai_audit.sh
```

This will:
1. ✅ Verify platform health
2. ✅ Sync config with folders
3. ✅ Audit basic integrity
4. ✅ Scan for cross-dependencies and role overlap

### Individual Operations

```bash
# Platform health check
deno run -A scripts/verify-platform.ts

# Sync config
deno run -A scripts/sync-supabase-config.ts

# Basic audit
deno run -A scripts/audit-functions.ts

# Advanced role-aware scan (v2)
deno run -A scripts/scan-cross-dependencies-v2.ts

# Generate bridges and routers
deno run -A scripts/generate-bridges.ts

# Clean up duplicates
deno run -A scripts/cleanup-duplicates.ts

# Restore ghost functions
deno run -A scripts/restore-ghost-functions.ts

# Verify installation
deno run -A scripts/verify-install.ts
```

---

## 📊 Output Files

### `scripts/audit-results.json` (Basic)
```json
{
  "timestamp": "2025-01-15T12:34:56.789Z",
  "summary": {
    "totalConfig": 107,
    "totalFolders": 200,
    "active": 86,
    "ghosts": 21,
    "orphans": 114
  },
  "active": [...],
  "ghosts": [...],
  "orphans": [...]
}
```

### `scripts/dependency-scan-results.json` (Advanced) ⭐ NEW
```json
{
  "timestamp": "2025-01-15T12:34:56.789Z",
  "summary": {
    "totalFunctions": 200,
    "duplicates": 2,
    "crossDependencies": 5,
    "sharedFeatures": 12,
    "categoryBridgesNeeded": 3,
    "featureRoutersNeeded": 8
  },
  "duplicates": [
    {
      "normalized": "stripe-webhook",
      "variants": ["stripe_webhook", "stripe-webhook"],
      "hasFolder": [false, true]
    }
  ],
  "crossDependencies": [
    {
      "caller": "andy-learn",
      "callerCategory": "andy",
      "target": "rocker-analyze",
      "targetCategory": "rocker",
      "type": "fetch"
    }
  ],
  "sharedFeatures": [
    {
      "feature": "tasks",
      "roles": {
        "super_andy": ["andy-task-orchestrator"],
        "rocker_admin": ["rocker-admin-tasks"],
        "rocker_user": ["rocker-tasks"]
      },
      "totalFunctions": 3,
      "needsRouter": true
    }
  ],
  "recommendations": {
    "categoryBridges": ["bridge-andy-rocker"],
    "featureRouters": ["router-tasks", "router-messaging"]
  }
}
```

---

## 🌟 Role-Aware Features (v2)

### Role Definitions

```typescript
ROLE_PREFIXES = {
  super_andy: /^(super-andy|andy-)/,
  rocker_admin: /^(admin-rocker|rocker-admin|rocker-audit)/,
  rocker_user: /^rocker-/,
  system_admin: /^(bootstrap-|ai_admin|ai_control)/,
}
```

### Feature Normalization

Functions are normalized to extract their core feature:
- `andy-task-orchestrator` → `task-orchestrator`
- `rocker-admin-tasks` → `tasks`
- `rocker-tasks` → `tasks`

### Multi-Role Detection

Scanner identifies when:
1. Same feature name appears across 2+ roles
2. Feature needs a unified router
3. Roles can share implementation via router pattern

---

## 🌉 Bridge & Router Patterns

### Category Bridge (Cross-Category Calls)
```
andy-learn → bridge-andy-rocker → rocker-analyze
```

**When**: Function in one category needs to call another category

**Generated**: `bridge-{callerCategory}-{targetCategory}`

**Example**: `bridge-andy-rocker`

### Feature Router (Multi-Role Features)
```
Any Role → router-tasks → {role-specific implementation}
```

**When**: Same feature exists across 2+ roles

**Generated**: `router-{feature}`

**Example**: `router-tasks`, `router-messaging`

**Routing Logic**:
- Checks user role from `user_roles` table
- Dispatches to role-specific implementation
- Maintains security and separation

---

## 🔒 Security Considerations

### Router Authentication
All auto-generated routers:
- ✅ Require JWT authentication
- ✅ Check `user_roles` table for authorization
- ✅ Log routing decisions
- ✅ Return 401 if unauthorized

### Bridge Functions
- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` for internal calls
- ✅ Validate inputs
- ✅ Handle errors gracefully
- ✅ Log all cross-category communication

### Duplicate Cleanup
- ✅ Preserves hyphenated versions (naming convention)
- ✅ Keeps variants with actual folders
- ✅ Removes cron schedules for deleted functions
- ✅ Requires manual git review before commit

---

## 💡 Common Workflows

### Workflow 1: Complete System Audit
```bash
# Run full v2 audit
bash scripts/ai_audit.sh

# Review reports
cat scripts/audit-results.json
cat scripts/dependency-scan-results.json

# Take action based on findings
```

### Workflow 2: Clean Up Duplicates
```bash
# Scan for duplicates
deno run -A scripts/scan-cross-dependencies-v2.ts

# Auto-cleanup
deno run -A scripts/cleanup-duplicates.ts

# Review changes
git diff supabase/config.toml

# Commit if correct
git add -A
git commit -m "chore: cleanup duplicate function entries"
```

### Workflow 3: Add Multi-Role Feature
```bash
# 1. Create role-specific implementations
mkdir -p supabase/functions/andy-analytics
mkdir -p supabase/functions/rocker-analytics
# (add implementations)

# 2. Scan for overlap
deno run -A scripts/scan-cross-dependencies-v2.ts

# 3. Generate router
deno run -A scripts/generate-bridges.ts
# Creates router-analytics

# 4. Sync config
deno run -A scripts/sync-supabase-config.ts

# 5. Update callers to use router
# Change: fetch('/functions/v1/andy-analytics')
# To: fetch('/functions/v1/router-analytics')
```

### Workflow 4: Restore Ghost Functions
```bash
# Find ghosts
deno run -A scripts/audit-functions.ts

# Restore as stubs
deno run -A scripts/restore-ghost-functions.ts

# Implement actual logic
# Edit each restored function

# Verify
deno run -A scripts/audit-functions.ts
```

---

## 🎯 Success Criteria

### ✅ Perfect State
- 0 duplicates
- 0 ghosts
- 0 orphans (or all intentional)
- All shared features have routers
- All cross-category calls use bridges
- CI passes green

### ⚠️ Acceptable State
- Some orphans (dev features)
- Some cross-dependencies (being migrated)
- CI passes with warnings
- Safe to deploy

### ❌ Broken State
- Duplicate function entries
- Missing config.toml
- Missing functions/ directory
- CI fails red
- DO NOT DEPLOY

---

## 🔧 Troubleshooting

### "Duplicates detected"
```bash
# Auto-fix
deno run -A scripts/cleanup-duplicates.ts

# Or manual edit config.toml
# Keep hyphenated versions, remove underscores
```

### "Cross-category dependencies found"
```bash
# Generate bridges
deno run -A scripts/generate-bridges.ts

# Update calling code to use bridges
```

### "Shared features detected"
```bash
# Generate routers
deno run -A scripts/generate-bridges.ts

# Update callers to use routers
# Ensure user_roles table exists
```

### "Ghost functions detected"
**Not an error** - config-only entries

**Optional fix**:
```bash
deno run -A scripts/restore-ghost-functions.ts
```

---

## 📚 File Reference

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `verify-platform.ts` | Health check | Before deploy |
| `sync-supabase-config.ts` | Add missing configs | After adding functions |
| `audit-functions.ts` | Basic integrity | Anytime |
| `scan-cross-dependencies-v2.ts` | Advanced analysis | Weekly / before refactor |
| `generate-bridges.ts` | Auto-create bridges/routers | After scan |
| `cleanup-duplicates.ts` | Remove dupes | After scan detects them |
| `restore-ghost-functions.ts` | Create stubs | When needed |
| `ai_audit.sh` | Full suite | Before deploy |
| `verify-install.ts` | System check | After setup |

---

## 🚀 GitHub Actions

`.github/workflows/verify-supabase-functions.yml`

Runs automatically on:
- Push to `main` or `develop`
- Pull requests

**Checks**:
1. Platform health
2. Config sync
3. Function audit  
4. **Fails** if config.toml needs updates

**Fix failed CI**:
```bash
deno run -A scripts/sync-supabase-config.ts
git add supabase/config.toml
git commit -m "chore: sync config"
git push
```

---

## 🎉 You're Ready!

Your Lovable Cloud function management now includes:
- ✅ Role-aware architecture analysis
- ✅ Multi-role feature detection
- ✅ Automated bridge & router generation
- ✅ Duplicate cleanup
- ✅ CI/CD protection
- ✅ Production-ready patterns

**Run your first v2 audit:**
```bash
bash scripts/ai_audit.sh
```

Check the results and take action! 🚀
