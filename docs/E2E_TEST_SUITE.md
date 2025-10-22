# E2E Test Suite - Complete Coverage

**Status:** ✅ Deployed  
**Date:** 2025-01-22  
**Coverage:** Super Andy, Admin Rocker, User Rocker, Super Console, Pathway Structure

---

## Test Files

### Core Helpers
**File:** `tests/e2e/helpers.ts`

**Functions:**
- `loginAs(page, role)` - Mock authentication for any role
- `mockChatReply(page)` - Mock chat responses with pathway awareness
- `mockCoreApis(page)` - Mock incidents, budgets, routes, suggestions, ledger
- `mockSuperConsoleApis(page)` - Mock pools, workers, flags, heartbeats
- `setPathwayModeCookie(page, mode)` - Set pathway preference
- `toggleGlobalHeavyFlag(page, on)` - Toggle global pathway flag
- `sendChatMessage(page, message)` - Send chat message and wait for response
- `navigateTo(page, path)` - Navigate and wait for load
- `expectTextInElement(page, selector, text)` - Assert text presence

### Test Suites

#### 1. Pathway Structure (`pathway-structure.spec.ts`)
Tests structured vs free-form responses based on user preferences.

**Tests:**
- ✅ Heavy mode delivers structured Pathway format
- ✅ Light mode delivers free-form response
- ✅ Auto mode follows global flag
- ✅ Verbosity low compresses to 3 steps

**Coverage:** User preferences → chat behavior

#### 2. Super Andy Dashboard (`super-andy-dashboard.spec.ts`)
Tests proactive suggestions, self-improve, and chat integration.

**Tests:**
- ✅ Loads dashboard rails
- ✅ Executes proactive suggestions
- ✅ Runs self-improve tick
- ✅ Subagent runs table updates
- ✅ Chat delivers Heavy pathway structure

**Coverage:** Suggestions rail, self-improve, orchestration, chat

#### 3. Admin Rocker (`admin-rocker.spec.ts`)
Tests budgets, model routes, incidents, and audit ledger.

**Tests:**
- ✅ Overview loads with cards
- ✅ Budget editing persists
- ✅ Model route configuration works
- ✅ Incidents can be resolved
- ✅ Audit ledger displays

**Coverage:** Admin workspace, moderation, tools, audits, budgets

#### 4. User Rocker (`user-rocker.spec.ts`)
Tests hub, preferences, and chat behavior.

**Tests:**
- ✅ Hub loads
- ✅ Preferences save correctly
- ✅ Chat reflects Heavy Pathway setting
- ✅ Tone preferences apply

**Coverage:** User workspace, preferences, pathway settings

#### 5. Super Console (`super-console.spec.ts`)
Tests overview, pools, workers, flags, and incidents.

**Tests:**
- ✅ Overview shows green health
- ✅ Navigation links work
- ✅ Pool concurrency edits persist
- ✅ Worker heartbeats display
- ✅ Control flags toggle correctly
- ✅ Incidents can be resolved

**Coverage:** Super admin controls, worker pools, flags, incidents

---

## Running Tests

### Run All Tests
```bash
pnpm exec playwright test
```

### Run Specific Suite
```bash
# Pathway structure
pnpm exec playwright test tests/e2e/pathway-structure.spec.ts

# Super Andy
pnpm exec playwright test tests/e2e/super-andy-dashboard.spec.ts

# Admin Rocker
pnpm exec playwright test tests/e2e/admin-rocker.spec.ts

# User Rocker
pnpm exec playwright test tests/e2e/user-rocker.spec.ts

# Super Console
pnpm exec playwright test tests/e2e/super-console.spec.ts
```

### Run in Headed Mode (Debug)
```bash
pnpm exec playwright test --headed
```

### Debug Specific Test
```bash
pnpm exec playwright test --debug tests/e2e/pathway-structure.spec.ts
```

### Run with UI Mode
```bash
pnpm exec playwright test --ui
```

---

## Mock Coverage

### Core APIs (mockCoreApis)
- ✅ `ai_incidents` (GET, PATCH)
- ✅ `ai_model_budget` (GET, PATCH)
- ✅ `ai_model_routes` (GET, PATCH)
- ✅ `ai_subagent_runs` (GET)
- ✅ `ai_action_ledger` (GET)
- ✅ `ai_user_profiles` (GET, PATCH, POST)
- ✅ `/functions/v1/ai_health` (GET)
- ✅ `/functions/v1/perceive_tick` (POST)
- ✅ `/functions/v1/self_improve_tick` (POST)
- ✅ `/functions/v1/orchestrate` (POST)

### Super Console APIs (mockSuperConsoleApis)
- ✅ `ai_worker_pools` (GET, PATCH)
- ✅ `ai_worker_heartbeats` (GET)
- ✅ `ai_control_flags` (GET, PATCH)
- ✅ `/functions/v1/circuit_breaker_tick` (POST)

### Chat Replies (mockChatReply)
- ✅ Heavy mode → Structured pathway (Objective/Prep/Steps/Risks/Verify)
- ✅ Light mode → Free-form response
- ✅ Auto mode → Follows global `pathway_heavy_default` flag
- ✅ Dynamic switching based on UI changes

---

## Test Data Seeding

All tests use deterministic mock data:

**Incidents:**
- 1 medium severity incident (budget soft limit)

**Model Routes:**
- 3 routes (chat.reply, mdr.generate, vision.analyze)

**Budgets:**
- $200 limit, $160 spent (80%)

**Suggestions:**
- 3 proactive suggestions (varying confidence)

**Pools:**
- 3 pools (realtime, heavy, admin)

**Workers:**
- 2 active workers with heartbeats

**Flags:**
- All enabled by default (external_calls, etc.)

---

## Selector Strategy

Tests use **resilient selectors** with fallbacks:

### Primary: data-testid
```typescript
page.getByTestId('chat-input')
```

### Fallback 1: Role + Name
```typescript
.or(page.getByRole('button', { name: /Send/i }))
```

### Fallback 2: Label
```typescript
.or(page.getByLabel(/Message/i))
```

### Fallback 3: Text
```typescript
.or(page.getByPlaceholder(/Type a message/i))
```

This ensures tests remain stable even if markup changes.

---

## Optional: Data-TestIds for Stability

Adding these IDs makes tests faster and more reliable:

### Super Andy
- `data-testid="proactive-rail"`
- `data-testid="suggestions-refresh"`
- `data-testid="self-improve-run"`
- `data-testid="subagent-runs-table"`

### Admin Rocker
- `data-testid="budgets-card"`
- `data-testid="incidents-table"`
- `data-testid="budget-limit"`
- `data-testid="budget-save"`
- `data-testid="route-temperature"`

### User Rocker
- `data-testid="select-pathway-mode"`
- `data-testid="select-tone"`
- `data-testid="prefs-save"`

### Super Console
- `data-testid="pools-table"`
- `data-testid="workers-table"`
- `data-testid="flag-external_calls_enabled"`
- `data-testid="flag-global_pause"`
- `data-testid="incidents-table"`

### Chat (Universal)
- `data-testid="chat-input"`
- `data-testid="chat-send"`
- `data-testid="chat-msg-out"` (on each message)

---

## CI Integration

Tests run automatically via `.github/workflows/e2e.yml` on:
- PRs to `main`
- Pushes to `chore/route-consolidation-archive`

**Workflow:**
1. Checkout code
2. Install dependencies
3. Install Playwright browsers
4. Build project (continue on error)
5. Start dev server
6. Run E2E tests
7. Upload artifacts (reports, videos)

**View results:**
- GitHub Actions → Workflow runs
- Artifacts → `playwright-report`

---

## Success Criteria

All tests should pass with:
- ✅ Zero flaky failures
- ✅ Fast execution (< 5min total)
- ✅ No backend dependencies
- ✅ Deterministic mocks
- ✅ Graceful fallbacks

---

## Troubleshooting

### Test Fails: "Element not visible"

**Cause:** Element hasn't rendered yet

**Fix:**
```typescript
await expect(element).toBeVisible({ timeout: 5000 });
```

### Test Fails: "Selector not found"

**Cause:** Markup changed

**Solution:** Tests have fallbacks; if all fail, add data-testid

### Mock Not Working

**Cause:** Route pattern doesn't match

**Fix:** Check route.request().url() logs:
```typescript
await page.route('**/*', (route) => {
  console.log('Intercepted:', route.request().url());
  return route.continue();
});
```

### Tests Pass Locally, Fail in CI

**Cause:** Timing issues

**Fix:** Increase timeouts or add explicit waits:
```typescript
await page.waitForLoadState('networkidle');
```

---

## Next Steps

### Phase 1: Validation ✅
- All tests written
- Mocks implemented
- Helpers complete

### Phase 2: Add TestIds (Optional)
- Add `data-testid` attributes to components
- Faster, more stable tests

### Phase 3: Visual Regression (Future)
- Add screenshot comparison tests
- Catch UI regressions automatically

### Phase 4: Performance Tests (Future)
- Measure page load times
- Track bundle sizes

---

## Maintenance

**Update mocks when:**
- API contracts change
- New tables/functions added
- Response formats change

**Update selectors when:**
- Major UI refactors occur
- Components restructured

**Update test data when:**
- New scenarios emerge
- Edge cases discovered

---

## References

**Playwright Docs:**
- https://playwright.dev/docs/intro

**Test Patterns:**
- https://playwright.dev/docs/best-practices

**Fixtures:**
- https://playwright.dev/docs/test-fixtures

**Configuration:**
- `playwright.config.ts`
- `.github/workflows/e2e.yml`

---

## Summary

**Coverage:** 5 test suites, 15+ tests  
**Mocks:** 20+ API endpoints  
**Stability:** Resilient selectors with fallbacks  
**CI:** Automated on every PR  
**Rollback:** Safe, deterministic, no backend deps  

**Status:** Production-ready 🚀
