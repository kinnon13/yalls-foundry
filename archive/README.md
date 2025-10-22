# `/archive` - Deprecated & Experimental Code

This directory contains code that is no longer active but kept for historical reference.

## 🎯 Purpose

- **Historical Reference** - See how things used to work
- **Recovery** - Restore old implementations if needed
- **Learning** - Understand evolution of the codebase
- **Compliance** - Keep audit trail of changes

## 📁 Structure

```
archive/
├── README.md                    This file
│
├── deprecated-functions/        Old edge functions
│   ├── andy-voice-session/     Removed 2025-10-22 (secrets issue)
│   ├── elevenlabs-conversation/ Removed 2025-10-22 (secrets issue)
│   ├── proxy-openai/           Removed 2025-10-22 (secrets issue)
│   ├── rocker-chat/            Removed 2025-10-22 (secrets issue)
│   ├── rocker-voice-session/   Removed 2025-10-22 (secrets issue)
│   ├── secrets-manage/         Removed 2025-10-22 (secrets issue)
│   └── text-to-speech/         Removed 2025-10-22 (secrets issue)
│
├── old-scripts/                 Outdated utility scripts
│   └── initialize-rocker.ts    (if not actively used)
│
└── experiments/                 Proof-of-concept code
    └── ...
```

## ⚠️ Important Rules

### 1. Nothing Here is Imported by Active Code
```typescript
// ❌ NEVER DO THIS
import { oldHelper } from '../../archive/old-scripts/helper';

// If you need code from archive, copy it to active codebase
```

### 2. No Changes to Archived Code
- Archive is **READ-ONLY**
- Don't fix bugs or refactor archived code
- If you need to change it, move it back to active codebase

### 3. Clear Archival Documentation
Every archived item should have a README explaining:
- **What**: What was this code for?
- **When**: When was it archived?
- **Why**: Why was it removed?
- **Replacement**: What replaced it (if anything)?

Example:
```markdown
# andy-voice-session/

**Archived**: 2025-10-22  
**Reason**: Contained hardcoded secrets preventing project remix  
**Replacement**: Will be re-added after remix with proper secrets management  
**Original Purpose**: Voice session handling for Andy AI assistant
```

## 📋 When to Archive

### Archive if:
- ✅ Code is no longer used anywhere
- ✅ Feature was deprecated
- ✅ Experimental feature didn't work out
- ✅ Major refactor replaced old implementation
- ✅ Keeping for historical/audit reasons

### Don't Archive if:
- ❌ Still imported by active code
- ❌ Might be needed soon (use feature flags instead)
- ❌ Just needs refactoring (refactor instead)

## 🗂️ Archival Process

### Step 1: Verify It's Safe
```bash
# Search for imports
grep -r "from.*your-file" src/
grep -r "import.*your-file" supabase/
```

### Step 2: Move to Archive
```bash
# Example: Archiving old script
git mv scripts/old-script.ts archive/old-scripts/
```

### Step 3: Document
Create or update README in archive subdirectory:
```markdown
## old-script.ts
- **Archived**: 2025-10-22
- **Reason**: Replaced by new-script.ts
- **Breaking changes**: N/A
```

### Step 4: Commit
```bash
git commit -m "archive: move old-script.ts to archive

- No longer used after refactor
- Replaced by scripts/new-script.ts
- Kept for reference
"
```

## 🔍 Finding Archived Code

### By Date
```bash
# See what was archived recently
git log --since="2025-10-01" -- archive/
```

### By Purpose
```bash
# Find old edge functions
ls archive/deprecated-functions/

# Find old scripts
ls archive/old-scripts/
```

### By Original Location
Check git history:
```bash
# Where did this file come from?
git log --follow archive/old-scripts/old-file.ts
```

## 🔄 Restoring Archived Code

If you need something from archive:

1. **Copy** (don't move) to active location
2. **Update** for current codebase
3. **Test** thoroughly
4. **Remove** from archive if successfully restored

```bash
# Example: Restoring a function
cp archive/deprecated-functions/my-function/index.ts \
   supabase/functions/my-function/index.ts

# Update the code, test, commit
git add supabase/functions/my-function/
git commit -m "feat: restore my-function with updates"

# Optionally remove from archive
git rm -r archive/deprecated-functions/my-function/
git commit -m "archive: remove my-function (restored to active)"
```

## 🧹 Maintenance

### Annually
- Review archived code
- Delete items >2 years old that won't be needed
- Consolidate related archived items
- Update documentation

### Before Deleting Permanently
Ask:
- Is there ANY chance we'll need this?
- Do we have it in git history?
- Does it have historical/compliance value?

If all answers are "no", safe to delete.

## 📊 Archive Statistics

| Category | Items | Oldest | Newest |
|----------|-------|--------|--------|
| Deprecated Functions | 7 | 2025-10-22 | 2025-10-22 |
| Old Scripts | 0 | - | - |
| Experiments | 0 | - | - |

**Last Cleanup**: Never  
**Next Cleanup**: 2026-10-22

## 🔗 Related Docs

- [PROJECT_RULES.md](../PROJECT_RULES.md) - Project organization rules
- [Git History](https://github.com/your-org/your-repo/commits/main) - Full change history

---

**Remember**: Archive is for historical reference only. Active code should NEVER import from here.

**Last Updated**: 2025-10-22
