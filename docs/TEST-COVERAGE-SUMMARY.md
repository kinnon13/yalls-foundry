# Test Coverage Summary

Last Updated: 2025-10-17

## 📊 Coverage Status: COMPREHENSIVE

### Coverage Thresholds (Enforced in CI)

| Metric | Threshold | Status |
|--------|-----------|--------|
| Branches | 80% | ✅ Enforced |
| Lines | 85% | ✅ Enforced |
| Statements | 85% | ✅ Enforced |
| Functions | 85% | ✅ Enforced |

**Configuration:** `vitest.config.ts`

---

## 🧪 Test Suites

### Unit Tests

#### Security (`tests/unit/security.test.ts`)
**Coverage:** Critical XSS/injection prevention

- ✅ HTML escaping (special chars, quotes, empty strings)
- ✅ URL sanitization (blocks javascript:, data:, vbscript:)
- ✅ Safe URL validation (allows https, mailto, tel, relative)
- ✅ File upload validation (MIME type, size limits)
- ✅ SVG blocking (default deny, explicit allow)
- ✅ Metadata sanitization (allowed keys only, 1KB limit)
- ✅ Rate limit error detection (code 42501, status 429)
- ✅ User-friendly rate limit messages

**Why Critical:** Prevents XSS attacks, malware uploads, and PII leaks.

#### Rate Limiting (`tests/unit/rate-limit.test.ts`)
**Coverage:** Abuse prevention

- ✅ Token bucket algorithm
- ✅ Window sliding (time-based buckets)
- ✅ Race condition handling (advisory locks)
- ✅ Scope isolation (per-user, per-IP)
- ✅ Counter cleanup (old window pruning)
- ✅ 429 response format

**Why Critical:** Prevents brute force, scraping, and DOS attacks.

#### Caching (`tests/unit/cache.test.ts`)
**Coverage:** Performance & scalability

- ✅ Redis GET/SET operations
- ✅ TTL expiration
- ✅ Stampede protection (NX locks)
- ✅ Cache invalidation patterns
- ✅ Fallback to DB when Redis unavailable

**Why Critical:** Reduces DB load, improves latency at scale.

#### Feed Cache (`tests/unit/feed-cache.test.ts`)
**Coverage:** Feed performance

- ✅ Cache key generation (profile, lane, cursor)
- ✅ Hit/miss tracking
- ✅ Write-through invalidation (post create/delete)
- ✅ Tenant scoping

**Why Critical:** Feed is highest-traffic endpoint.

#### Telemetry (`tests/unit/telemetry.test.ts`)
**Coverage:** Observability & privacy

- ✅ Meta sanitization (no PII in logs)
- ✅ Allowed key filtering
- ✅ Size capping (1KB max)
- ✅ Fire-and-forget semantics (non-blocking)

**Why Critical:** Ensures telemetry doesn't leak sensitive data.

#### Entitlements (`tests/unit/entitlements-gate.test.ts`)
**Coverage:** Feature access control

- ✅ Feature gating (allowed vs blocked)
- ✅ Paywall display logic
- ✅ Age restrictions (min_age_years)
- ✅ Missing date_of_birth handling
- ✅ Entitlement check logging

**Why Critical:** Prevents unauthorized feature access.

#### Kernel Host (`tests/unit/kernel-host.test.ts`)
**Coverage:** Dashboard modules

- ✅ Cursor-based pagination
- ✅ Load more button behavior
- ✅ Duplicate prevention (deduplication)
- ✅ Observability (kernel_render, kernel_open logs)

**Why Critical:** Core dashboard UX.

#### Edge Rate Limit (`tests/unit/edge-rate-limit.test.ts`)
**Coverage:** Edge function protection

- ✅ 429 responses with headers
- ✅ X-RateLimit-* header format
- ✅ Retry-After calculation
- ✅ Scope isolation (per-endpoint)

**Why Critical:** Edge functions are public attack surface.

---

### E2E Tests

#### Smoke Tests (`tests/e2e/smoke.spec.ts`)
**Coverage:** Core user flows

- ✅ Home feed loads (all lanes: for_you, following, shop)
- ✅ Scroll triggers impression logging
- ✅ Entitlement paywall displays for gated features
- ✅ Performance budget (p95 < 3s)

**Why Critical:** Catches regressions in critical paths.

---

### SQL Tests

#### RLS Validation (`tests/sql/rls-validation.test.sql`)
**Coverage:** Database security

- ✅ RLS enabled on all tables
- ✅ Policies present (SELECT, INSERT, UPDATE, DELETE)
- ✅ Admin bypass policies work
- ✅ Critical indexes exist
- ✅ SECURITY DEFINER functions have search_path set

**Why Critical:** Database is the security perimeter.

**Run Manually:**
```bash
psql $DATABASE_URL -f tests/sql/rls-validation.test.sql
```

---

## 🛠️ Test Infrastructure

### Provider Stack (`tests/utils/renderWithProviders.tsx`)

**Mirrors Production Stack:**
```tsx
<QueryClientProvider>
  <BrowserRouter>
    <UIProvider>  {/* ← Includes Theme + Tooltip + Toasters */}
      {children}
    </UIProvider>
  </BrowserRouter>
</QueryClientProvider>
```

**Prevents:**
- ❌ "Invalid hook call" errors
- ❌ Missing context provider errors
- ❌ Theme/router/query client errors

**Usage:**
```tsx
import { renderWithProviders } from 'tests/utils/renderWithProviders';

test('component renders', () => {
  renderWithProviders(<YourComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mock Utilities

**Sentry Mock:**
```tsx
import { mockSentry } from 'tests/utils/renderWithProviders';

vi.mock('@sentry/react', () => mockSentry());
```

**Supabase Mock:**
```tsx
import { mockSupabase } from 'tests/utils/renderWithProviders';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase(),
}));
```

**Global Setup (`tests/setup.ts`):**
- ✅ Mocks: Sentry, Supabase, crypto.randomUUID, sessionStorage
- ✅ Environment variables (import.meta.env)
- ✅ Fake timers for interval-based code

---

## 🚨 CI Gates

### Typecheck Gate
```yaml
- name: Type check
  run: npm run typecheck  # Blocks PR on failure
```

### Lint Gate
```yaml
- name: Lint
  run: npm run lint  # Blocks PR on failure
```

### Coverage Gate
```yaml
- name: Test with coverage
  run: npm run test -- --coverage --reporter=verbose
  
- name: Enforce coverage thresholds
  run: |
    # Enforced in vitest.config.ts
    # branches: 80%, lines: 85%, statements: 85%, functions: 85%
```

### SQL Validation Gate (`.github/workflows/sql-validation.yml`)
```yaml
- RLS enabled check
- SECURITY DEFINER search_path check
- SQL injection vector detection
- Admin function role check validation
```

### E2E Performance Gate
```yaml
- Home page load < 3s (p95)
- Feed scroll impression logging works
- Entitlement gates functional
```

---

## 📈 Coverage Gaps (Known & Acceptable)

### Not Covered (Intentional)
1. **External integrations:** Stripe webhooks, email sending (tested manually)
2. **File upload to storage:** Supabase Storage SDK (tested in staging)
3. **Real-time subscriptions:** WebSocket handling (out of scope for v1)
4. **Multi-region failover:** Infrastructure concern (not code)

### Future Coverage (Phase 2)
1. **Visual regression tests:** Percy/Chromatic for UI changes
2. **Accessibility tests:** axe-core for WCAG compliance
3. **Load tests in CI:** k6 runs on schedule (not per PR)
4. **Fuzz testing:** Random input generation for RPC endpoints

---

## 🎯 How to Run Tests

### All Tests
```bash
npm run test
```

### With Coverage
```bash
npm run test -- --coverage
```

### Watch Mode (Development)
```bash
npm run test -- --watch
```

### Single File
```bash
npm run test tests/unit/security.test.ts
```

### E2E Tests
```bash
npm run test:e2e
```

### SQL Validation
```bash
psql $DATABASE_URL -f tests/sql/rls-validation.test.sql
```

---

## ✅ Summary

**Test Status:** 🟢 PRODUCTION-READY

- ✅ 8 comprehensive unit test suites
- ✅ 1 E2E smoke test suite
- ✅ 1 SQL security validation suite
- ✅ 4 CI gates (typecheck, lint, coverage, SQL)
- ✅ Shared test infrastructure (no provider drift)
- ✅ Coverage thresholds enforced (80%+ branches, 85%+ lines)

**Test Infrastructure:** Robust & maintainable
- ✅ Provider-safe rendering
- ✅ Mock utilities for external deps
- ✅ Fake timers for time-based code
- ✅ Global setup for env/mocks

**CI Integration:** Automated & blocking
- ✅ PR checks block merge on failure
- ✅ Coverage reports uploaded to Codecov
- ✅ SQL validation on migration changes
- ✅ E2E performance budgets enforced

**Next Steps (User Action):**
1. Run load tests after infrastructure setup (k6 script ready)
2. Review coverage report for any blind spots
3. Add visual regression tests (optional, Phase 2)
