# Prompt Archive Log

This file documents prompt versions and archives for rollback safety.

## 2025-01-22: Pre-Pathway Archive

**Status:** ✅ Archived before Pathway Template v1 rollout

**What was archived:**
- All existing prompts in `promptpacks/*` (if any existed)
- Original system prompts before structured pathway formatting

**How to restore:**
```bash
# Restore from git if needed
git log --all --full-history -- "promptpacks/*"

# Or disable Pathway globally
UPDATE ai_control_flags SET pathway_heavy_default = false;
```

**Rollback plan:**
1. Set `pathway_heavy_default = false` in `ai_control_flags`
2. All users with `pathway_mode = 'auto'` revert to free-form
3. Users with `pathway_mode = 'heavy'` can manually switch to 'light' in Preferences

## Pathway Template v1 - Introduced 2025-01-22

**File:** `promptpacks/pathway_template.v1.md`

**Structure:**
1. Define Objective
2. Prep Requirements
3. Core Steps (5-7 max)
4. Risks & Mitigations
5. Verify & Next

**Personalization:**
- Respects `verbosity` (low = 3 steps, medium/high = 5-7)
- Respects `format_pref` (bullets/paragraphs/tables)
- Respects `approval_mode` (ask = adds confirmation prompt)
- Respects `tone` from user profile

**Feature flags:**
- `ai_user_profiles.pathway_mode`: auto | heavy | light
- `ai_control_flags.pathway_heavy_default`: global default for auto users

**Formatter:**
- `src/ai/shared/formatPathway.ts`
- `formatPathway()` - main formatter
- `resolvePathwayMode()` - mode resolution
- `shouldUseHeavyPathway()` - A/B testing support

**Testing:**
See `docs/PATHWAY_SMOKE_TESTS.md` for validation checklist

**Metrics tracked:**
- Ratings tagged with `pathway:v1` in `ai_learnings`
- Self-improve loop analyzes avg rating nightly
- If avg < 4, proposes prompt adjustments

---

## Archive Policy

**When to archive:**
- Before major prompt refactors
- When replacing core system prompts
- Before A/B tests that change prompt behavior

**What to keep:**
- Git history of all prompt files
- This log with rollback instructions
- Feature flag states for easy rollback

**How long to keep:**
- Minimum 90 days in git history
- Production archives: indefinite
- Test/experimental: 30 days

---

## Future Archives

Document new archives below:

### [Date]: [Archive Name]
- **Files archived:** ...
- **Reason:** ...
- **Rollback:** ...
