# Crisper Pathways - Implementation Complete ✅

**Date:** 2025-01-22  
**Status:** DEPLOYED - Ready for testing  
**Version:** Pathway Template v1

---

## What Was Deployed

### 1. Database Schema ✅
- Added `ai_user_profiles.pathway_mode` (auto/heavy/light)
- Added `ai_user_profiles.visual_pref` (text field)
- Added `ai_control_flags.pathway_heavy_default` (boolean)

### 2. Promptpack ✅
- **File:** `promptpacks/pathway_template.v1.md`
- 5-section structure: Objective, Prep, Steps, Risks, Verify
- Personalization rules for verbosity, format, approval mode

### 3. Formatter Utility ✅
- **File:** `src/ai/shared/formatPathway.ts`
- Functions:
  - `formatPathway()` - transforms raw plans to crisp format
  - `resolvePathwayMode()` - determines user's pathway preference
  - `shouldUseHeavyPathway()` - A/B testing support
  - `detectObjective()` - extracts goal from user message
  - `hashUserId()` - deterministic bucketing for A/B

### 4. User Preferences UI ✅
- **File:** `src/pages/UserRocker/Preferences.tsx`
- New fields:
  - Action Pathways dropdown (Auto/Heavy/Light)
  - Visual Preference text input
- Saves to `ai_user_profiles` table

### 5. Documentation ✅
- `docs/archive/PROMPTS_ARCHIVED.md` - Archive log with rollback instructions
- `docs/PATHWAY_SMOKE_TESTS.md` - 10 tests for validation
- `docs/PATHWAY_IMPLEMENTATION_COMPLETE.md` - This file

---

## How to Use

### For Users

**Enable Structured Plans:**
1. Go to `/rocker/preferences`
2. Set "Action Pathways" to "Heavy"
3. Save
4. All plans will now follow the 5-section format

**Disable (go back to free-form):**
1. Set "Action Pathways" to "Light"
2. Save

**Use org default:**
1. Set to "Auto"
2. Inherits global `pathway_heavy_default` setting

### For Admins

**Enable globally:**
```sql
UPDATE ai_control_flags 
SET pathway_heavy_default = true;
```

**Disable globally:**
```sql
UPDATE ai_control_flags 
SET pathway_heavy_default = false;
```

**Check user preferences:**
```sql
SELECT user_id, pathway_mode, verbosity, approval_mode 
FROM ai_user_profiles 
WHERE pathway_mode IS NOT NULL;
```

---

## Integration Points

### Where to Wire the Formatter

**In your chat edge function** (e.g., `andy-chat`, `rocker-chat`):

```typescript
import { formatPathway, resolvePathwayMode, detectObjective } from '~/ai/shared/formatPathway';

// After plan synthesis from MDR/AI
const userId = session.user.id;

// Fetch user profile
const { data: profile } = await supabase
  .from('ai_user_profiles')
  .select('pathway_mode, verbosity, format_pref, approval_mode')
  .eq('user_id', userId)
  .single();

// Fetch global flags
const { data: flags } = await supabase
  .from('ai_control_flags')
  .select('pathway_heavy_default')
  .single();

// Decide if user gets structured format
const useHeavy = resolvePathwayMode(profile, flags);

if (useHeavy && plan?.steps?.length) {
  const payload = {
    objective: plan.objective ?? detectObjective(userMessage),
    metric: plan.metric ?? plan.kpi,
    prep: plan.prep ?? plan.requirements ?? [],
    steps: plan.steps.map(s => ({
      title: s.title ?? s.action,
      detail: s.detail ?? s.how
    })),
    risks: (plan.risks ?? []).map(r => ({
      risk: r.risk ?? r.name,
      mitig: r.mitig ?? r.mitigation ?? r.fix
    })),
    verify: plan.verify ?? plan.tests ?? []
  };
  
  const formatted = formatPathway(payload, profile);
  
  return new Response(formatted, {
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Fallback to free-form
return new Response(renderFreeform(plan, profile), {
  headers: { 'Content-Type': 'text/plain' }
});
```

### Feedback Loop (Optional Enhancement)

**Tag ratings in your RateThis component:**
```typescript
// When user rates a plan
await supabase.from('ai_learnings').insert({
  user_id: userId,
  rating: stars,
  tags: ['pathway:v1', 'actionability'],
  context: { objective: plan.objective }
});
```

**Analyze in nightly self_improve_tick:**
```typescript
const { data: learnings } = await supabase
  .from('ai_learnings')
  .select('rating, tags')
  .gte('created_at', since)
  .contains('tags', ['pathway:v1']);

const pathwayRatings = learnings.map(l => l.rating);
const avg = pathwayRatings.reduce((a, c) => a + c, 0) / pathwayRatings.length;

if (avg < 4) {
  console.log('Pathway avg rating low, consider adjustments');
  // Optionally: insert improvement suggestion into ai_proactive_suggestions
}
```

---

## Testing Checklist

Run these tests to validate deployment (see `docs/PATHWAY_SMOKE_TESTS.md` for details):

- [ ] Test 1: User toggle respected (heavy mode works)
- [ ] Test 2: Global default works (auto inherits flag)
- [ ] Test 3: Light mode disables pathway
- [ ] Test 4: Verbosity low = 3 steps
- [ ] Test 5: Approval mode = ask adds confirmation
- [ ] Test 6: Feedback tags saved to ai_learnings
- [ ] Test 7: Preferences UI saves correctly
- [ ] Test 10: Rollback works (disable flag reverts behavior)

**Optional advanced tests:**
- [ ] Test 8: A/B bucketing (10% rollout)
- [ ] Test 9: Nightly learning loop runs

---

## Rollback Plan

### Immediate Rollback (No Code Changes)

**Option 1: Disable globally**
```sql
UPDATE ai_control_flags 
SET pathway_heavy_default = false;
```
All "auto" users revert to free-form immediately.

**Option 2: Disable per user**
```sql
UPDATE ai_user_profiles 
SET pathway_mode = 'light' 
WHERE pathway_mode = 'heavy';
```

**Option 3: Remove DB columns (destructive)**
```sql
ALTER TABLE ai_user_profiles 
DROP COLUMN pathway_mode,
DROP COLUMN visual_pref;

ALTER TABLE ai_control_flags 
DROP COLUMN pathway_heavy_default;
```

### Git Rollback

```bash
# Revert formatter and promptpack
git revert <commit-hash>

# Or restore from archive
cp docs/archive/prompts/2025-01-22/* promptpacks/
```

---

## Success Metrics

**Week 1 targets:**
- [ ] 10+ users opt into Heavy mode
- [ ] Avg rating ≥ 4.0 for pathway:v1 tagged plans
- [ ] Zero rollbacks required

**Week 2 targets:**
- [ ] Enable global default (all auto users get Heavy)
- [ ] 50+ pathway-formatted plans delivered
- [ ] Feedback loop running (nightly analysis)

**Month 1 targets:**
- [ ] 80% of active users on Heavy or Auto (with global=true)
- [ ] Avg rating ≥ 4.5
- [ ] Prompt adjustments based on feedback (if needed)

---

## Next Steps

### Immediate (Today)
1. ✅ Deploy database migrations
2. ✅ Deploy formatter code
3. ✅ Deploy Preferences UI
4. ⏳ Run smoke tests (Test 1, 2, 3, 7, 10)
5. ⏳ Enable for yourself: `UPDATE ai_user_profiles SET pathway_mode='heavy' WHERE user_id='...'`

### Week 1
1. Wire formatter into `andy-chat` or `rocker-chat` edge function
2. Test with 5-10 pilot users
3. Collect feedback via ratings
4. Monitor `ai_learnings` table for avg rating

### Week 2
1. If avg ≥ 4.0, enable `pathway_heavy_default = true` globally
2. A/B test 10% rollout if desired (modify `shouldUseHeavyPathway` call)
3. Add feedback loop to `self_improve_tick`

### Month 1
1. Analyze long-term ratings
2. Iterate on prompt based on feedback
3. Add visual enhancements (if users request via `visual_pref`)
4. Consider pathway v2 with branching logic

---

## Files Reference

**Core implementation:**
- `promptpacks/pathway_template.v1.md` - Prompt template
- `src/ai/shared/formatPathway.ts` - Formatter utility
- `src/pages/UserRocker/Preferences.tsx` - User UI

**Documentation:**
- `docs/PATHWAY_SMOKE_TESTS.md` - Test checklist
- `docs/archive/PROMPTS_ARCHIVED.md` - Archive log
- `docs/PATHWAY_IMPLEMENTATION_COMPLETE.md` - This file

**Database:**
- Migration added columns to `ai_user_profiles` and `ai_control_flags`

---

## Support

**If pathway format not showing:**
- Check user's `pathway_mode` setting in DB
- Verify `pathway_heavy_default` flag value
- Confirm formatter is wired into edge function
- Check edge function logs for errors

**If UI not saving:**
- Check browser console for errors
- Verify RLS policies allow updates to `ai_user_profiles`
- Confirm migration applied successfully

**Questions or issues:**
- Check `docs/PATHWAY_SMOKE_TESTS.md` for debugging steps
- Review git history: `git log --all -- "promptpacks/*"`
- Contact team for support

---

## Conclusion

Crisper Pathways v1 is **deployed and ready**. No deletions were made, everything is archived, and rollback is trivial (one SQL flag flip). Start testing with yourself, pilot with a few users, then roll out globally once confident.

**Next action:** Run Test 1 from smoke tests to validate it works end-to-end. 🚀
