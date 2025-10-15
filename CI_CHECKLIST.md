# CI/CD Checklist - Y'alls Platform Production Readiness

**Version:** 1.0  
**Date:** 2025-10-15  
**Status:** Enforcement Active

---

## Critical Checks (Must Pass for Deploy)

### 1. ✅ No Mock Implementations
```bash
# CI Command
grep -r "mock" src/ --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v ".spec"
# Expected: Exit code 0 (no matches)
```
**Purpose**: Prevent mock auth adapters, payment handlers, or data services from reaching production.

### 2. ✅ Immutable Ledgers Protected
```sql
-- CI Command (via psql)
SELECT tablename, rulename 
FROM pg_rules 
WHERE tablename IN ('commission_ledger', 'settlement_batches', 'claim_events', 'affiliate_subscriptions')
AND rulename LIKE 'block_%';
-- Expected: 8 rules (2 per table: updates, deletes)
```
**Purpose**: Verify DB-level protection for financial audit trails.

### 3. ✅ Rate Limiting Active
```typescript
// CI Command (check edge functions)
grep -r "createRateLimitMiddleware" supabase/functions/
// Expected: At least 10 endpoints protected
```
**Purpose**: Ensure critical routes have rate limiting to prevent abuse.

### 4. ✅ Rocker Event Coverage
```typescript
// CI Command (parse logs or static analysis)
const requiredEvents = [
  'user.create.profile', 'user.upload.media', 'user.create.event',
  'user.create.post', 'user.save.post', 'user.create.listing',
  'user.create.referral'
];
// Check: Each event type emitted at least once in codebase
grep -r "rocker.logEvent" src/ | grep -E "(${requiredEvents.join('|')})"
// Expected: Match count >= 7
```
**Purpose**: Verify Rocker is integrated across all major features.

### 5. ✅ Consent Enforcement
```typescript
// CI Command
grep -r "has_site_opt_in\|hasConsent" src/lib/ supabase/functions/
// Expected: Present in auth guards and AI middleware
```
**Purpose**: Ensure AI features respect user consent settings.

### 6. ✅ HNSW Indexes Present
```sql
-- CI Command
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE '%hnsw%';
-- Expected: At least 2 indexes (ai_user_memory, ai_global_knowledge)
```
**Purpose**: Verify vector search performance optimizations are live.

### 7. ✅ RLS Policies Complete
```sql
-- CI Command
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
HAVING COUNT(*) < 1;
-- Expected: 0 rows (all public tables have RLS)
```
**Purpose**: Prevent data leaks via missing row-level security.

### 8. ✅ Edge Function Rate Limit Headers
```bash
# CI Command (test critical endpoints)
curl -I https://[project].supabase.co/functions/v1/rocker-chat | grep "X-RateLimit-"
# Expected: Headers present (X-RateLimit-Limit, X-RateLimit-Remaining, etc.)
```
**Purpose**: Verify rate limit middleware is active and exposing correct headers.

### 9. ✅ Moderator Console Accessible
```bash
# CI Command (check route exists)
grep -r "ModeratorConsole" src/routes/
# Expected: Found in control-room.tsx
```
**Purpose**: Ensure moderation tools are deployed and accessible to admins.

### 10. ✅ Financial Ledger Audit Trail
```sql
-- CI Command
SELECT COUNT(*) 
FROM commission_ledger 
WHERE created_at > NOW() - INTERVAL '7 days';
-- Expected: > 0 (if transactions occurred)
```
**Purpose**: Verify ledger is actively logging transactions.

---

## E2E Test Suite (10 Critical Paths)

### Test 1: Save & Reshare Post
```typescript
test('User can save and reshare post', async () => {
  await login();
  const postId = await createTestPost();
  await savePost(postId);
  await resharePost(postId, 'Great content!');
  expect(await getPostSaves(postId)).toBeGreaterThan(0);
});
```

### Test 2: Upload → AI Analysis
```typescript
test('Upload triggers Rocker analysis', async () => {
  await login();
  await uploadFile('horse.jpg');
  const suggestions = await waitForSuggestions();
  expect(suggestions).toContain('horse');
});
```

### Test 3: Event Wizard Flow
```typescript
test('User can create event with AI form', async () => {
  await login();
  await navigateTo('/events/create');
  await fillEventDetails();
  await clickGenerateForm();
  await waitForFormGeneration();
  expect(await getFormFields()).toHaveLength(5);
});
```

### Test 4: Purchase → Ledger Entry
```typescript
test('Purchase creates commission entry', async () => {
  await login();
  await purchaseItem('listing-123', { referrer: 'user-456' });
  const entries = await getCommissionLedger('user-456');
  expect(entries).toHaveLength(1);
  expect(entries[0].transaction_type).toBe('referral');
});
```

### Test 5: Claim → Payout Preview
```typescript
test('Claim entity shows payout preview', async () => {
  await login();
  await claimEntity('horse-789');
  await navigateTo('/mlm/dashboard');
  const preview = await getPayoutPreview();
  expect(preview.pending_amount).toBeGreaterThan(0);
});
```

### Test 6: Rocker Proactive Suggestion
```typescript
test('Rocker suggests next action', async () => {
  await login();
  await uploadFile('event-poster.jpg');
  const action = await waitForRockerAction();
  expect(action.type).toBe('suggest.create_event');
});
```

### Test 7: Moderator Approve/Deny
```typescript
test('Admin can moderate flagged content', async () => {
  await loginAsAdmin();
  await navigateTo('/admin/control-room');
  await clickModeratorTab();
  const flags = await getPendingFlags();
  await approveFlag(flags[0].id);
  expect(await getFlagStatus(flags[0].id)).toBe('resolved');
});
```

### Test 8: Consent Gate
```typescript
test('AI features blocked without consent', async () => {
  await login();
  await revokeConsent('site_opt_in');
  await uploadFile('test.jpg');
  expect(await getRockerSuggestions()).toHaveLength(0);
});
```

### Test 9: Rate Limit 429
```typescript
test('Rate limit returns 429 after threshold', async () => {
  await login();
  const requests = [];
  for (let i = 0; i < 15; i++) {
    requests.push(fetch('/functions/v1/rocker-chat'));
  }
  const responses = await Promise.all(requests);
  expect(responses.filter(r => r.status === 429).length).toBeGreaterThan(0);
});
```

### Test 10: Recall → Navigate
```typescript
test('User can recall and navigate to saved content', async () => {
  await login();
  await savePost('post-123');
  await navigateTo('/posts/saved');
  await searchSaved('barrel racing');
  const results = await getSearchResults();
  expect(results).toContain('post-123');
});
```

---

## Performance Benchmarks

### Latency Targets (p95)

| Operation | Target | Alert If |
|-----------|--------|----------|
| Event Emission | < 50ms | > 100ms |
| Action Delivery | < 200ms | > 500ms |
| Chat Response (TTFB) | < 3s | > 5s |
| Memory Lookup | < 100ms | > 300ms |
| Ledger Insert | < 100ms | > 500ms |
| Rate Limit Check | < 10ms | > 50ms |

### CI Command (Synthetic Check)
```bash
# Run synthetic latency tests
npm run test:performance
# Expected: All operations within targets
```

---

## Security Scans

### 1. Dependency Vulnerabilities
```bash
npm audit --production
# Expected: 0 high/critical vulnerabilities
```

### 2. SQL Injection Vectors
```bash
# Check for raw SQL usage
grep -r "execute\|query\|sql\`" src/ supabase/functions/ | grep -v "supabase.from"
# Expected: 0 matches (all queries use client methods)
```

### 3. PII Exposure
```sql
-- Check for unencrypted sensitive columns
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name IN ('email', 'phone', 'ssn', 'address');
-- Expected: Verify RLS policies + encryption for sensitive columns
```

---

## Deployment Gates

### Pre-Deploy
- [ ] All critical checks pass
- [ ] E2E test suite passes (10/10)
- [ ] Performance benchmarks within targets
- [ ] Security scans clear
- [ ] Manual smoke test by QA

### Post-Deploy
- [ ] Health endpoint returns 200
- [ ] Rocker event logs flowing
- [ ] Rate limit headers present
- [ ] Moderator console loads
- [ ] No error spikes in monitoring

---

## Monitoring Alerts

### Critical Alerts (PagerDuty)
- **Rate Limit Failures**: > 5% of requests
- **Ledger Write Failures**: > 0.1% of transactions
- **Rocker Event Failures**: > 1% of emissions
- **Database Connection Pool**: > 80% utilization
- **Edge Function Errors**: > 5% error rate

### Warning Alerts (Slack)
- **Slow Queries**: > 1s execution time
- **Consent Opt-Out Rate**: > 10% increase
- **Moderator Queue**: > 50 pending items
- **Commission Calculation Drift**: > $100 discrepancy

---

## Rollback Criteria

Automatically rollback if any of these occur within 10 minutes of deploy:

1. Error rate > 10% across any service
2. Ledger write failures > 1%
3. Rate limit check failures > 5%
4. Database RLS policy violations spike
5. User login success rate drops > 20%

---

**Sign-Off Required**: Platform Lead, Security Lead, Product Manager

**Last Updated**: 2025-10-15
