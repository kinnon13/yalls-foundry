# Security Audit & RPC Testing

## 🔒 Security Status: 🟡 AMBER → 🟢 GREEN

### Current Status
- ✅ Core RPCs (theme, KPIs, modules) are policy-checked
- ✅ All user tables have RLS enabled
- ✅ Most SECURITY DEFINER functions have search_path set
- ⚠️  One function (`_log_rpc`) needs search_path added
- ✅ No NOT/jsonb boolean errors found in policies

### Quick Security Checks

#### 1. Tables without RLS
```bash
psql $DATABASE_URL -c "
SELECT n.nspname, c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' 
  AND c.relkind='r' 
  AND c.relrowsecurity = false
  AND c.relname NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns');
"
```
**Expected:** 0 rows

#### 2. SECURITY DEFINER without search_path
```bash
psql $DATABASE_URL -c "
SELECT n.nspname, p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE p.prosecdef = true
  AND n.nspname = 'public'
  AND p.proname NOT LIKE 'st_%'
  AND NOT EXISTS (
    SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
    WHERE cfg LIKE '%search_path%public%'
  );
"
```
**Expected:** 0 rows (after fixing `_log_rpc`)

#### 3. Test Core RPCs
```bash
# Run RPC contract tests
psql $DATABASE_URL -f scripts/test-rpc-contracts.sql
```
**Expected:** All ✅ checks pass

### Common Security Patterns

#### ✅ Good: Boolean coercion on jsonb
```sql
-- Policy using jsonb field
CREATE POLICY "check_archived" ON my_table
FOR SELECT USING (
  COALESCE((metadata->>'archived')::boolean, false) = false
);
```

#### ❌ Bad: Direct NOT on jsonb
```sql
-- This will cause "argument of NOT must be type boolean" error
CREATE POLICY "check_archived" ON my_table
FOR SELECT USING (
  NOT (metadata->'archived')  -- ERROR!
);
```

#### ✅ Good: SECURITY DEFINER with search_path
```sql
CREATE OR REPLACE FUNCTION my_secure_func()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- REQUIRED!
AS $$
BEGIN
  -- Function body
END;
$$;
```

### CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Security Audit
  run: |
    psql $DATABASE_URL -f scripts/security-audit.sql
    node scripts/validate-security.mjs
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
```

### Fixing _log_rpc

The `_log_rpc` function needs `SET search_path = public` added. Run this migration:

```sql
CREATE OR REPLACE FUNCTION public._log_rpc(
  p_user_id uuid,
  p_rpc_name text,
  p_params jsonb,
  p_result text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ADD THIS LINE
AS $$
BEGIN
  INSERT INTO public.rpc_call_log (user_id, rpc_name, params, result)
  VALUES (p_user_id, p_rpc_name, p_params, p_result);
END;
$$;
```

### Testing Checklist

Before marking security as 🟢 GREEN:

- [ ] Run `scripts/security-audit.sql` - no FAIL results
- [ ] Run `scripts/test-rpc-contracts.sql` - all ✅ pass
- [ ] Fix `_log_rpc` search_path
- [ ] Verify RLS enabled on all new tables
- [ ] Test with non-member user (should see 0 rows or permission error)
- [ ] Test with member user (should see their data)
- [ ] Add CI gate for security audit

### Resources

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SECURITY DEFINER Best Practices](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
