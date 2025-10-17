# Testing Strategy

## Overview

Comprehensive test coverage ensures production stability and catches regressions before deployment.

## Test Categories

### 1. Unit Tests (`tests/unit/`)
**Purpose**: Test individual functions and modules in isolation

**Coverage**:
- ✅ Cache operations (`cache.test.ts`)
- ✅ Rate limiting (`rate-limit.test.ts`)
- ✅ Entitlements & age gating (`entitlements.test.ts`)
- ✅ Telemetry & usage tracking (`telemetry.test.ts`)
- ✅ Edge function rate limiting (`edge-rate-limit.test.ts`)
- ✅ Feed caching with Redis (`feed-cache.test.ts`)

**Run**: `npm run test tests/unit/`

**Coverage Targets**:
- Branches: 80%
- Lines: 85%
- Statements: 85%
- Functions: 85%

---

### 2. E2E Tests (`tests/e2e/`)
**Purpose**: Test critical user flows in real browser

**Coverage**:
- ✅ Feed loading (`smoke.spec.ts`)
- ✅ Lane switching (for_you, following, shop)
- ✅ Impression logging
- ✅ Performance (p95 < 250ms)
- ✅ Dashboard entitlement gates

**Run**: `npm run test:e2e`

**SLOs**:
- Feed loads in < 250ms (p95)
- No console errors
- Impression events logged correctly

---

### 3. SQL Validation Tests (`tests/sql/`)
**Purpose**: Validate database security and schema

**Coverage**:
- ✅ RLS enabled on all tables (`rls-validation.test.sql`)
- ✅ Proper policies for usage_events
- ✅ Critical indexes exist
- ✅ SECURITY DEFINER functions have search_path

**Run**: `psql <connection_string> -f tests/sql/rls-validation.test.sql`

**Critical Checks**:
```sql
-- 1. RLS enabled
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname='public' 
AND rowsecurity=false;
-- Expected: 0 critical tables

-- 2. Usage events writable by authenticated users
-- Should succeed without errors

-- 3. Indexes present
SELECT COUNT(*) FROM pg_indexes
WHERE indexname IN (
  'idx_usage_user_time',
  'idx_usage_surface_lane_time',
  'idx_usage_type_item_time'
);
-- Expected: 3
```

---

### 4. Load Tests (`scripts/load-test.js`)
**Purpose**: Validate system handles production traffic

**Scenarios**:
1. **Auth brute force** (30 req/sec)
   - Should be blocked at 20/min
   - Returns 429 with Retry-After

2. **Feed scraping** (100 concurrent users)
   - Cache hit rate > 30%
   - p95 latency < 250ms

3. **Action spam** (10 posts/sec)
   - Rate limited properly
   - Returns 429 when exceeded

**Run**: 
```bash
export API_URL=https://your-app.com
export SUPABASE_ANON_KEY=your-key
k6 run scripts/load-test.js --duration 60s --vus 100
```

**Success Criteria**:
- ✅ p95 < 250ms
- ✅ Error rate < 2%
- ✅ Rate limit blocks > 10%
- ✅ Cache hit rate > 30%

---

## CI/CD Integration

### GitHub Actions

**CI Workflow** (`.github/workflows/ci.yml`):
- ✅ Type checking (strict mode)
- ✅ Linting (ESLint + Prettier)
- ✅ Unit tests with coverage gates
- ✅ Security checks (no hardcoded secrets)

**E2E Workflow** (`.github/workflows/e2e.yml`):
- ✅ Playwright smoke tests
- ✅ Performance assertions
- ✅ Runs on every PR

**Load Test Workflow** (`.github/workflows/load-test.yml`):
- ⏳ Manual trigger (post-infrastructure setup)
- ⏳ Runs k6 scenarios
- ⏳ Validates SLOs

---

## Test Utilities

### Provider-Safe Rendering (`tests/utils/renderWithProviders.tsx`)

**Problem**: React hook errors in tests when components expect providers

**Solution**: Wrap all test components with required providers

```typescript
import { renderWithProviders } from 'tests/utils/renderWithProviders';

test('component renders', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText(/hello/i)).toBeInTheDocument();
});
```

**Includes**:
- QueryClientProvider (TanStack Query)
- BrowserRouter (React Router)
- ThemeProvider (next-themes)
- TooltipProvider (Radix UI)

---

### Global Mocks (`tests/setup.ts`)

**Mocked by default**:
- ✅ Sentry (captureException, withScope, etc.)
- ✅ Supabase client (rpc, from, auth)
- ✅ crypto.randomUUID
- ✅ sessionStorage
- ✅ import.meta.env

**Why**: Prevents external API calls, ensures deterministic tests, reduces noise

---

## Coverage Requirements

### Thresholds (vitest.config.ts)
```typescript
coverage: {
  thresholds: {
    branches: 80,
    lines: 85,
    statements: 85,
    functions: 85,
  },
}
```

### Excluded from Coverage
- `node_modules/`
- `tests/`
- `*.config.ts`
- `src/integrations/supabase/types.ts` (auto-generated)

### Current Coverage (as of 2025-10-17)
- Unit tests: 6 test files
- E2E tests: 1 test file
- SQL tests: 1 test file
- Total assertions: 50+

---

## Testing Anti-Patterns (Avoid These)

### ❌ DON'T: Render components without providers
```typescript
// This will fail with "Invalid hook call"
render(<MyComponent />);
```

### ✅ DO: Use renderWithProviders
```typescript
renderWithProviders(<MyComponent />);
```

---

### ❌ DON'T: Make real API calls in tests
```typescript
// This is slow and flaky
const response = await fetch('https://api.example.com');
```

### ✅ DO: Mock external dependencies
```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn().mockResolvedValue({ data: [] }) }
}));
```

---

### ❌ DON'T: Use hardcoded timeouts
```typescript
// This is flaky
await new Promise(r => setTimeout(r, 1000));
```

### ✅ DO: Use waitFor or fake timers
```typescript
vi.useFakeTimers();
// ... test code
vi.runAllTimers();
vi.useRealTimers();
```

---

## Running Tests Locally

### Quick Test (Watch Mode)
```bash
npm run test
```

### Full Test Suite with Coverage
```bash
npm run test -- --coverage
```

### E2E Tests
```bash
npm run test:e2e
```

### SQL Validation
```bash
psql $DATABASE_URL -f tests/sql/rls-validation.test.sql
```

### Load Tests (requires infrastructure)
```bash
k6 run scripts/load-test.js --duration 60s --vus 100
```

---

## Pre-Merge Checklist

Before merging to main, ensure:

- [ ] All unit tests pass
- [ ] Coverage meets thresholds (80/85/85/85)
- [ ] E2E smoke tests pass
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] SQL validation passes
- [ ] No hardcoded secrets

**CI will block merges that fail these checks.**

---

## Debugging Failed Tests

### 1. Check Test Output
```bash
npm run test -- --reporter=verbose
```

### 2. Run Single Test
```bash
npm run test tests/unit/cache.test.ts
```

### 3. Enable Debug Logs
```bash
DEBUG=* npm run test
```

### 4. Check Coverage Report
```bash
npm run test -- --coverage
open coverage/index.html
```

### 5. E2E Debug Mode
```bash
npm run test:e2e -- --debug
```

---

## Future Testing Improvements

### Phase 2 (After Launch)
- [ ] Visual regression tests (Percy/Chromatic)
- [ ] Contract tests for API boundaries
- [ ] Property-based tests (fast-check)
- [ ] Performance benchmarks (tracked over time)
- [ ] Mutation testing (Stryker)

### Phase 3 (At Scale)
- [ ] Chaos engineering (random failures)
- [ ] Synthetic monitoring (production)
- [ ] User session replay (Sentry)
- [ ] A/B test framework validation

---

## Metrics & Monitoring

### Test Health Dashboard
Track these metrics:
- Test execution time (should be < 30s for unit, < 3m for E2E)
- Flaky test rate (should be < 1%)
- Coverage trend (should stay above thresholds)
- CI pass rate (should be > 95%)

### Alerting
- ⚠️  Coverage drops below thresholds
- ⚠️  E2E tests fail 2+ times in a row
- ⚠️  Load test SLOs not met
- ⚠️  SQL validation finds security issues

---

## Summary

**Current State**: ✅ Production-Ready Test Coverage

- 6 unit test files covering critical paths
- 1 E2E smoke test suite
- 1 SQL security validation suite
- 1 k6 load test script
- CI/CD gates blocking bad code
- Coverage thresholds enforced

**Next Steps**: Configure infrastructure (PgBouncer, Redis, Cloudflare, Sentry), then run load tests to validate billion-user scale.
