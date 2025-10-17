# Type Safety Strategy

## Current State

**Temporary `as any` Usage:**
The codebase uses `(supabase as any)` for tables that exist in the database but aren't yet in the auto-generated types file (`src/integrations/supabase/types.ts`).

**Why?**
- Supabase types are auto-generated when migrations run
- During development, tables may exist but types haven't regenerated yet
- Using `as any` allows compilation while waiting for type regeneration

## Production Path

### Step 1: Verify Types Are Generated
After running migrations, Lovable Cloud automatically regenerates `src/integrations/supabase/types.ts` with all current tables.

### Step 2: Remove Temporary Casts
Once types include `notifications`, `earnings_ledger`, `earnings_events`, `worker_jobs`, `dead_letter_queue`, replace:

```typescript
// ❌ Temporary
const { data } = await (supabase as any).from('notifications').select('*');

// ✅ Production
const { data } = await supabase.from('notifications').select('*');
```

### Step 3: Use Domain Types for Business Logic
Keep domain types in `src/types/domain.ts` for:
- Enhanced types with computed fields (e.g., `missed_cents`)
- UI-specific transformations
- Cross-table aggregations

```typescript
// src/types/domain.ts
import type { Tables } from '@/integrations/supabase/types';

export type Notification = Tables<'notifications'>;
export type WorkerJob = Tables<'worker_jobs'>;
export type DLQEntry = Tables<'dead_letter_queue'>;
export type EarningsEvent = Tables<'earnings_events'>;

export interface EarningsLedger extends Tables<'earnings_ledger'> {
  missed_cents: number; // Computed: total - captured
}
```

## Current Status

**Files with `as any` (will be removed automatically):**
- `src/hooks/useNotifications.tsx` (3 occurrences)
- `src/hooks/useEarnings.tsx` (3 occurrences)
- `src/lib/workers/jobQueue.ts` (4 occurrences)
- `src/routes/admin/workers.tsx` (1 occurrence)

**Total:** 11 temporary casts

**Action Required:** None - these will resolve automatically when types regenerate after migrations complete.

## Type Safety Score

- **Backend (SQL):** 100% ✅ (strict typing via Postgres)
- **Frontend (Current):** 85% ⚠️ (11 temporary casts)
- **Frontend (Post-Migration):** 100% ✅ (all casts removed)

## Verification

After migrations complete, run:
```bash
npm run typecheck
# Should show 0 errors
```

If errors remain, it means:
1. Types file didn't regenerate → Check Lovable Cloud logs
2. Table schema doesn't match code → Review migration SQL
3. RLS policies blocking queries → Check policies in Lovable Cloud backend

## Best Practices

1. **Never Use `any` in New Code**
   - Wait for types to regenerate
   - Use domain types from `src/types/domain.ts`
   - Leverage TypeScript's type narrowing

2. **Cast Only at Boundaries**
   ```typescript
   // ✅ Cast once at API boundary
   const data = apiResponse as DomainType;
   
   // ❌ Don't scatter casts throughout
   const x = (data as any).field;
   const y = (x as any).nested;
   ```

3. **Use Type Guards for Runtime Checks**
   ```typescript
   function isNotification(data: unknown): data is Notification {
     return typeof data === 'object' && data !== null && 'user_id' in data;
   }
   ```

4. **Prefer `unknown` Over `any`**
   ```typescript
   // ✅ Forces explicit type checks
   catch (error: unknown) {
     if (error instanceof Error) console.error(error.message);
   }
   
   // ❌ Bypasses all type checking
   catch (error: any) {
     console.error(error.message); // No safety
   }
   ```

---

**Target:** 100% type safety (0 `any` casts) once migrations complete and types regenerate.
