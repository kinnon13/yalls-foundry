# Production Audit Scripts

This directory contains audit scripts to verify production readiness.

## Quick Start

```bash
# Run full audit
./scripts/audit/run-production-audit.sh

# Verify RLS policies (requires database access)
psql $DATABASE_URL -f scripts/audit/verify-rls.sql

# Run tenant isolation tests
npm test tests/integration/tenant-isolation.test.ts
```

## What Gets Checked

### 1. Code-Level Checks (Automated)
- ✅ No legacy role keys (`'user'`, `'admin'`, etc.)
- ✅ No raw `supabase.from()` calls without guards
- ✅ No web TTS (server-only enforcement)
- ✅ Search isolation (dual indices)
- ✅ Job queue infrastructure
- ✅ Rate limiting coverage
- ✅ Tenant guard usage
- ✅ Observability (request_id, org_id, actor_role)
- ✅ Test coverage (tenant leak tests)

### 2. Database-Level Checks (Manual)
- 🔍 RLS enabled on all tenant tables
- 🔍 Complete CRUD policies (SELECT/INSERT/UPDATE/DELETE)
- 🔍 Feature flag auth (super_admin only for SET)
- 🔍 Voice events (admin-only SELECT)

### 3. Integration Tests (CI)
- 🧪 Tenant isolation (no cross-org data leakage)
- 🧪 Feature flag auth (users can't toggle)
- 🧪 File isolation
- 🧪 Task isolation
- 🧪 Message isolation

### 4. Load Tests (Manual)
- 📈 Noisy neighbor protection (k6/artillery)
- 📈 P95 latency < 400ms under load
- 📈 Queue backpressure working

## Exit Codes

- `0` - All checks passed
- `1` - Critical failures found (blocks production)

## CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run Production Audit
  run: ./scripts/audit/run-production-audit.sh

- name: Verify RLS Policies
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: psql $DATABASE_URL -f scripts/audit/verify-rls.sql

- name: Run Tenant Isolation Tests
  run: npm test tests/integration/tenant-isolation.test.ts
```

## Fixing Common Issues

### Raw DB Calls
```typescript
// ❌ Before
const { data } = await supabase.from('rocker_messages').select('*');

// ✅ After
return withTenantGuard(req, async ({ orgId }) => {
  const client = createTenantClient(orgId);
  const { data } = await client.from('rocker_messages').select('*');
  return json(data);
});
```

### Feature Flag Auth
```sql
-- Add super_admin check
ALTER POLICY "Users can update flags" ON feature_flags
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);
```

### Search Isolation
```typescript
// Implement dual indices
const privateHits = await searchPrivate(orgId, query, topK);
const marketHits = await searchMarket(query, topK);
return { private: privateHits, market: marketHits };
```

## Reporting

After running audits, include in PR:
1. Screenshot of audit output
2. RLS verification query results
3. Tenant isolation test results
4. Load test charts (if applicable)

## Resources

- [PRODUCTION_READINESS_AUDIT.md](../../docs/PRODUCTION_READINESS_AUDIT.md) - Full findings
- [SECURITY_AUDIT_ZERO_EXCUSES.md](../../docs/SECURITY_AUDIT_ZERO_EXCUSES.md) - Security gaps
- [tenantGuard.ts](../../supabase/functions/_shared/tenantGuard.ts) - Tenant isolation wrapper
