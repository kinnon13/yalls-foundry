# Pathway Template v1 - Smoke Tests

Quick validation checklist for Crisper Pathways rollout.

## Test 1: User Toggle Respected

**Setup:**
```sql
UPDATE ai_user_profiles 
SET pathway_mode = 'heavy' 
WHERE user_id = '{YOUR_USER_ID}';
```

**Test:**
1. Go to `/super-andy` or `/rocker` chat
2. Ask: "Give me a plan to reduce routes to 31"
3. Expect response with structure:
   - **Objective:** ...
   - **Prep:** ...
   - **Steps:** (numbered 1-7)
   - **Risks & Mitigations:** ...
   - **Verify & Next:** ...

**Pass criteria:** Response follows 5-section format

---

## Test 2: Global Default Works

**Setup:**
```sql
-- Enable globally
UPDATE ai_control_flags 
SET pathway_heavy_default = true;

-- Set user to auto
UPDATE ai_user_profiles 
SET pathway_mode = 'auto' 
WHERE user_id = '{YOUR_USER_ID}';
```

**Test:**
1. Ask for a plan (any topic)
2. Should get Heavy pathway format

**Pass criteria:** Auto users inherit global default

---

## Test 3: Light Mode Disables Pathway

**Setup:**
```sql
UPDATE ai_user_profiles 
SET pathway_mode = 'light' 
WHERE user_id = '{YOUR_USER_ID}';
```

**Test:**
1. Ask for a plan
2. Should get free-form response (no strict 5-section format)

**Pass criteria:** Light mode users get unstructured responses

---

## Test 4: Verbosity Low = 3 Steps

**Setup:**
```sql
UPDATE ai_user_profiles 
SET pathway_mode = 'heavy', verbosity = 'low'
WHERE user_id = '{YOUR_USER_ID}';
```

**Test:**
1. Ask for a complex plan
2. Should get max 3 steps in **Steps:** section

**Pass criteria:** Low verbosity compresses to 3 steps

---

## Test 5: Approval Mode = Ask

**Setup:**
```sql
UPDATE ai_user_profiles 
SET pathway_mode = 'heavy', approval_mode = 'ask'
WHERE user_id = '{YOUR_USER_ID}';
```

**Test:**
1. Ask for a plan
2. Response should end with: "**Confirm to proceed?**"

**Pass criteria:** Ask mode adds confirmation prompt

---

## Test 6: Feedback Tags Saved

**Test:**
1. Get a pathway-formatted plan
2. Rate it using RateThis component (add stars)
3. Check database:
```sql
SELECT * FROM ai_learnings 
WHERE tags @> ARRAY['pathway:v1']
ORDER BY created_at DESC 
LIMIT 5;
```

**Pass criteria:** Rating saved with `pathway:v1` tag

---

## Test 7: Preferences UI Works

**Test:**
1. Go to `/rocker/preferences`
2. Change "Action Pathways" dropdown
3. Save
4. Refresh and verify value persists
5. Try each option: Auto / Heavy / Light

**Pass criteria:** Dropdown saves correctly to `ai_user_profiles.pathway_mode`

---

## Test 8: A/B Bucketing (Optional)

**Setup:**
```typescript
// In edge function or chat handler
const useHeavy = shouldUseHeavyPathway(
  userId, 
  profile, 
  flags, 
  10 // 10% rollout
);
```

**Test:**
1. Create 10 test users
2. Check which bucket they land in
3. Should be ~10% heavy, 90% default

**Pass criteria:** Deterministic bucketing by user ID hash

---

## Test 9: Nightly Learning Loop

**Setup:**
- Add 5 ratings for `pathway:v1` tagged plans
- Mix of high (5) and low (2) ratings

**Test:**
1. Run `self_improve_tick` manually or wait for nightly cron
2. Check `ai_learnings` aggregation
3. If avg < 4, should propose prompt adjustment

**Pass criteria:** Low ratings trigger improvement suggestions

---

## Test 10: Rollback Safety

**Test:**
```sql
-- Disable globally
UPDATE ai_control_flags 
SET pathway_heavy_default = false;

-- Or revert at user level
UPDATE ai_user_profiles 
SET pathway_mode = 'light';
```

**Expected:** All users revert to free-form responses

**Pass criteria:** Rollback works without code changes

---

## Quick Commands

**Enable for yourself:**
```sql
UPDATE ai_user_profiles 
SET pathway_mode = 'heavy' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

**Enable globally:**
```sql
UPDATE ai_control_flags SET pathway_heavy_default = true;
```

**Check your current mode:**
```sql
SELECT pathway_mode, verbosity, approval_mode 
FROM ai_user_profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

**View recent pathway ratings:**
```sql
SELECT rating, tags, context->>'objective' as objective, created_at
FROM ai_learnings 
WHERE tags @> ARRAY['pathway:v1']
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Success Criteria (MVP)

- ✅ Tests 1-3 pass (basic toggle functionality)
- ✅ Test 7 passes (UI works)
- ✅ Test 10 passes (rollback safe)

**Nice to have:**
- Tests 4-5 (personalization)
- Test 6 (feedback tracking)
- Tests 8-9 (advanced features)

---

## Debugging

**If pathway format not showing:**
1. Check `ai_control_flags.pathway_heavy_default` value
2. Check user's `pathway_mode` setting
3. Verify `formatPathway()` is being called in edge function
4. Check console logs for formatter errors

**If UI not saving:**
1. Check browser network tab for 400/500 errors
2. Verify `ai_user_profiles` has `pathway_mode` column
3. Check RLS policies allow updates

**If feedback not tracking:**
1. Verify `RateThis` component adds `pathway:v1` tag
2. Check `ai_learnings` table has data
3. Confirm `self_improve_tick` is scheduled and running
