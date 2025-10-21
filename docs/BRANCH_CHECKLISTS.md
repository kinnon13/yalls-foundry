# Branch-Specific Task Checklists

Complete checklists for each of the 7 branches showing exactly what they can/can't touch and what they must deliver.

---

## 🎨 Branch 1: `feature/ui-polish`

### What You CAN Touch ✅
- `src/pages/**` - All page components
- `src/components/**` - All UI components
- `src/hooks/**` - React hooks
- `src/lib/utils/**` - Client-side utilities
- `src/index.css` - Global styles
- `tailwind.config.ts` - Design system tokens
- `public/**` - Static assets

### What You CANNOT Touch ❌
- `supabase/migrations/**` - No DB changes
- `supabase/functions/**` - No edge function changes
- `src/integrations/supabase/**` - No backend integration changes
- `scripts/**` - No infrastructure scripts

### Tasks Checklist (67 total)

#### Onboarding Flow (8 tasks)
- [ ] Fix broken onboarding page (currently errors on load)
- [ ] Add progress indicator (steps 1/2/3)
- [ ] Org creation wizard
- [ ] Role selection (user/admin)
- [ ] Welcome tour (interactive highlights)
- [ ] Skip button for returning users
- [ ] Mobile-responsive layout
- [ ] Loading states for async steps

#### Voice Interface (12 tasks)
- [ ] Waveform animation during recording
- [ ] Visual feedback for voice activity detection
- [ ] Loading spinner during TTS generation
- [ ] Error states (mic permission denied, TTS failed)
- [ ] Voice settings panel (speed, pitch)
- [ ] Push-to-talk vs always-on toggle
- [ ] Mobile voice UI (large tap targets)
- [ ] Mute/unmute controls
- [ ] Volume slider
- [ ] Transcript display (real-time)
- [ ] Export transcript button
- [ ] Voice command help modal

#### Knowledge Base UI (9 tasks)
- [ ] Search bar with autocomplete
- [ ] Filter by category/date/author
- [ ] Card view + list view toggle
- [ ] Inline preview on hover
- [ ] Markdown rendering with syntax highlighting
- [ ] Empty state (no results)
- [ ] Skeleton loaders for search results
- [ ] Infinite scroll pagination
- [ ] Quick actions (edit, delete, share)

#### Navigation & Layout (7 tasks)
- [ ] Responsive sidebar (collapse on mobile)
- [ ] Breadcrumbs for nested pages
- [ ] Global search (CMD+K)
- [ ] User menu (profile, settings, logout)
- [ ] Notification bell with unread count
- [ ] Quick switcher (orgs, threads)
- [ ] Footer with links

#### Forms & Inputs (8 tasks)
- [ ] Consistent form validation (Zod + react-hook-form)
- [ ] Error messages inline + toast
- [ ] Loading states on submit buttons
- [ ] Disabled states with tooltips
- [ ] Autosave drafts (debounced)
- [ ] Rich text editor (Tiptap or Slate)
- [ ] File upload with drag-drop + progress
- [ ] Multi-select with chips

#### Responsive Design (6 tasks)
- [ ] Mobile layout (all pages)
- [ ] Tablet layout (breakpoint 768px)
- [ ] Touch targets ≥44px
- [ ] Swipe gestures (threads, modals)
- [ ] Bottom nav on mobile
- [ ] Responsive tables (horizontal scroll)

#### Dark Mode (4 tasks)
- [ ] Audit all components for dark mode contrast
- [ ] Fix white text on white bg issues
- [ ] Toggle animation (smooth transition)
- [ ] System preference detection

#### Loading & Empty States (5 tasks)
- [ ] Skeleton loaders (threads, messages, KB items)
- [ ] Empty state illustrations (zero threads, no results)
- [ ] Loading overlay for full-page operations
- [ ] Progress bars for long operations
- [ ] Retry button on errors

#### Accessibility (8 tasks)
- [ ] Keyboard navigation (tab order, focus traps)
- [ ] ARIA labels on all interactive elements
- [ ] Screen reader testing
- [ ] Color contrast ratio ≥4.5:1 (WCAG AA)
- [ ] Focus indicators visible
- [ ] Skip to main content link
- [ ] Alt text on all images
- [ ] Error announcements via live regions

### PR Checklist (Before Merge)
- [ ] Lint passes (`npm run lint`)
- [ ] Typecheck passes (`npm run typecheck`)
- [ ] No console.logs or debugger statements
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark mode works correctly
- [ ] Loading states for all async operations
- [ ] Error states with user-friendly messages
- [ ] Accessibility: keyboard nav + ARIA labels
- [ ] Visual regression tests pass (if applicable)
- [ ] Storybook stories added (if applicable)

### Merge Target
`staging` (merge multiple times per day)

### Feature Flags
None needed (pure UI, no backend changes)

---

## 🔒 Branch 2: `feature/tenant-security`

### What You CAN Touch ✅
- `supabase/functions/**/index.ts` - Wrap with `withTenantGuard`
- `supabase/migrations/**` - RLS policies ONLY (via train)
- `scripts/audit/**` - Security verification scripts

### What You CANNOT Touch ❌
- `src/pages/**` - No UI changes
- `src/components/**` - No UI changes
- Schema changes (new tables/columns) - Must go via train

### Tasks Checklist (45 total)

#### Tenant Guard Migration (23 tasks)
Migrate these functions to use `withTenantGuard`:
- [ ] rocker-chat
- [ ] rocker-organize-knowledge (complete the partial migration)
- [ ] andy-chat
- [ ] andy-voice-session
- [ ] andy-admin
- [ ] andy-task-os
- [ ] andy-learn-from-message
- [ ] kb-search
- [ ] kb-ingest
- [ ] kb-item
- [ ] kb-playbook
- [ ] kb-related
- [ ] ingest-upload
- [ ] ingest-paste
- [ ] business-quick-setup
- [ ] business-scan-site
- [ ] feed-api
- [ ] generate-embeddings
- [ ] proxy-openai
- [ ] crm-track
- [ ] feature-flags
- [ ] entity-lookup
- [ ] collection_operations

#### RLS Policy Completion (12 tasks)
Add `org_id` + RLS to these tables (via train):

**rocker_files**:
- [ ] Create migration to add `org_id` column
- [ ] Write backfill script (from rocker_threads)
- [ ] Create SELECT policy (org-scoped)
- [ ] Create INSERT policy (org-scoped)
- [ ] Create UPDATE policy (org-scoped)
- [ ] Create DELETE policy (org-scoped)

**voice_events**:
- [ ] Add `org_id` column + backfill
- [ ] Create all CRUD policies

**rocker_memories**:
- [ ] Add `org_id` column + backfill
- [ ] Create all CRUD policies

**learning_entries**:
- [ ] Add `org_id` column + backfill
- [ ] Create all CRUD policies

#### Feature Flag Security (3 tasks)
- [x] ~~Lock UPDATE to super_admin~~ (Done)
- [ ] Verify no client-side writes bypass RLS
- [ ] Add audit log for flag changes

#### Admin Operations Audit (2 tasks)
- [ ] Hook up `admin_operations_audit` table to all service role queries
- [ ] Create dashboard showing admin actions

#### CI Security Gates (5 tasks)
- [x] ~~Created `check-tenant-guards.sh`~~ (Done)
- [ ] Add to GitHub Actions (fail on violations)
- [ ] Add `verify-rls.sql` to CI
- [ ] Block merge if security audit fails
- [ ] Auto-comment PR with security warnings

### Migration Template
All DB changes must go through **train branch**:

```sql
-- Migration: Add org_id to [table_name]
-- Train: train/db-20251022

-- 1. Add column (safe, nullable first)
ALTER TABLE public.[table_name] 
  ADD COLUMN IF NOT EXISTS org_id UUID;

-- 2. Backfill (idempotent)
UPDATE public.[table_name] t
SET org_id = p.org_id
FROM public.profiles p
WHERE t.org_id IS NULL 
  AND t.user_id = p.id;

-- 3. Create index
CREATE INDEX IF NOT EXISTS idx_[table]_org 
  ON public.[table_name](org_id);

-- 4. Enable RLS
ALTER TABLE public.[table_name] 
  ENABLE ROW LEVEL SECURITY;

-- 5. Create policies
DROP POLICY IF EXISTS [table]_select_org ON public.[table_name];
CREATE POLICY [table]_select_org
ON public.[table_name]
FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Repeat for INSERT, UPDATE, DELETE
```

### PR Checklist (Before Merge)
- [ ] All touched functions use `withTenantGuard`
- [ ] Zero raw `supabase.from()` calls
- [ ] `./scripts/audit/check-tenant-guards.sh` passes
- [ ] If migration: PR targets `train/db-YYYYMMDD`
- [ ] If migration: Tested on scratch DB
- [ ] RLS policies have SELECT + INSERT + UPDATE + DELETE
- [ ] Tenant isolation tests pass
- [ ] Added audit logging for admin actions
- [ ] No breaking changes to existing APIs

### Merge Target
- **Functions only**: `staging`
- **DB changes**: `train/db-YYYYMMDD` → then staging

### Feature Flags
- `org_rls_strict_mode` - Enable strict org isolation (default: OFF in staging)

---

## 🔍 Branch 3: `feature/search-isolation`

### What You CAN Touch ✅
- `supabase/functions/kb-search/**` - Search API
- `supabase/migrations/**` - Dual index tables (via train)
- `src/pages/Knowledge.tsx` - Search UI updates

### What You CANNOT Touch ❌
- Other edge functions (unless search-related)
- Unrelated migrations

### Tasks Checklist (10 total)

#### Data Migration (5 tasks)
- [ ] Identify current embedding storage location
- [ ] Write migration script: `knowledge_chunks` → `private_chunks`
- [ ] Backfill `private_chunks` with `org_id`
- [ ] Create public listing embeddings → `market_chunks`
- [ ] Verify zero data loss (row counts match)

#### Index Optimization (3 tasks)
- [ ] Create ivfflat index on `private_chunks` (tune `lists` param)
- [ ] Create ivfflat index on `market_chunks`
- [ ] Benchmark query performance (target: P95 < 200ms)

#### API Updates (2 tasks)
- [ ] Update `kb-search` to call dual RPCs (`match_private_chunks` + `match_market_chunks`)
- [ ] Merge private + marketplace results with relevance scoring
- [ ] Add telemetry (private vs market query ratio)

### Migration Script (via train)
```sql
-- Migration: Populate dual search indices
-- Train: train/db-20251022

-- 1. Backfill private_chunks from existing knowledge_items
INSERT INTO public.private_chunks (org_id, doc_id, content, embedding)
SELECT 
  ki.org_id,
  ki.id::text,
  ki.content,
  ki.embedding
FROM public.knowledge_items ki
WHERE ki.org_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 2. Backfill market_chunks from public listings
INSERT INTO public.market_chunks (listing_id, content, embedding)
SELECT 
  ml.id,
  ml.description,
  ml.embedding
FROM public.marketplace_listings ml
WHERE ml.is_public = true
ON CONFLICT DO NOTHING;

-- 3. Create indices (if not exist from previous migration)
CREATE INDEX IF NOT EXISTS idx_private_chunks_ivf 
  ON public.private_chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_market_chunks_ivf 
  ON public.market_chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 200);
```

### Search API Update
```typescript
// supabase/functions/kb-search/index.ts
import { withTenantGuard } from '../_shared/tenantGuard.ts';

serve((req) =>
  withTenantGuard(req, async ({ supa, orgId, flags }) => {
    const { query, embedding } = await req.json();
    
    // Search both indices in parallel
    const [privateResults, marketResults] = await Promise.all([
      supa.rpc('match_private_chunks', {
        org_id_in: orgId,
        query_embedding: embedding,
        match_count: 10
      }),
      flags.search_v2_enabled 
        ? supa.rpc('match_market_chunks', {
            query_embedding: embedding,
            match_count: 5
          })
        : { data: [] }
    ]);
    
    // Merge and score
    return new Response(JSON.stringify({
      private: privateResults.data || [],
      marketplace: marketResults.data || []
    }));
  })
);
```

### PR Checklist (Before Merge)
- [ ] Migration targets `train/db-YYYYMMDD`
- [ ] Migration tested on scratch DB
- [ ] Row counts verified (no data loss)
- [ ] Benchmark: P95 < 200ms for 10k docs
- [ ] Feature flag `search_v2_enabled` defaults to OFF
- [ ] Telemetry added (query counts, latency)
- [ ] Backwards compatible (old search still works)
- [ ] Integration test: org A can't see org B's private docs

### Merge Target
- **Migrations**: `train/db-YYYYMMDD` → staging
- **API changes**: `staging`

### Feature Flags
- `search_v2_enabled` - Enable dual search (default: OFF in staging)

---

## ⚙️ Branch 4: `feature/job-queue`

### What You CAN Touch ✅
- `supabase/functions/workers-ingest/**` - Worker code
- `supabase/migrations/**` - Job queue tables (via train)
- `supabase/functions/kb-ingest/**` - Convert to async
- `supabase/functions/ingest-*/**` - Convert to async

### What You CANNOT Touch ❌
- UI components (except loading states)
- Search functions
- Security functions

### Tasks Checklist (11 total)

#### Processors (4 tasks)
- [ ] **Embedding processor**
  - Batch OpenAI API calls (100 chunks/batch)
  - Handle rate limits (429 retry with backoff)
  - Store in `private_chunks` with `org_id`
  
- [ ] **Crawl processor**
  - URL fetching (with timeout + SSRF protection)
  - HTML parsing (sanitize XSS with DOMPurify)
  - Chunk + embed → queue embed job
  
- [ ] **OCR processor**
  - Image → text (OCR.space or Tesseract)
  - Chunk + embed → queue embed job
  
- [ ] **PDF processor**
  - Extract text (pdf-parse)
  - Chunk + embed → queue embed job

#### Infrastructure (5 tasks)
- [ ] Per-org concurrency enforcement (verify `claim_ingest_job`)
- [ ] Dead letter queue (DLQ) for failed jobs
- [ ] Retry logic with exponential backoff
- [ ] Idempotency key deduplication
- [ ] Worker deployment (edge function cron or Fly.io)

#### Convert to Async (2 tasks)
- [ ] `kb-ingest` → enqueue instead of sync embed
- [ ] `ingest-upload` → enqueue OCR/parse

### Worker Template
```typescript
// supabase/functions/workers-ingest/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/tenantGuard.ts";

serve(async () => {
  const admin = adminClient();
  
  // Claim one job
  const { data: job } = await admin.rpc('claim_ingest_job');
  if (!job) return new Response('idle');
  
  try {
    // Process based on kind
    switch (job.kind) {
      case 'embed':
        await processEmbedding(admin, job);
        break;
      case 'crawl':
        await processCrawl(admin, job);
        break;
      case 'ocr':
        await processOCR(admin, job);
        break;
    }
    
    // Mark done
    await admin
      .from('ingest_jobs')
      .update({ status: 'done' })
      .eq('id', job.id);
      
    return new Response('ok');
  } catch (err) {
    // Move to DLQ if max attempts reached
    if (job.attempts >= 3) {
      await admin
        .from('ingest_jobs')
        .update({ status: 'error', payload: { error: err.message } })
        .eq('id', job.id);
    }
    throw err;
  }
});
```

### PR Checklist (Before Merge)
- [ ] Worker handles all 4 job types
- [ ] Per-org concurrency enforced (max 1-2 concurrent/org)
- [ ] DLQ moves jobs after 3 failures
- [ ] Idempotency key prevents duplicate work
- [ ] Retry logic has exponential backoff
- [ ] SSRF protection on URL crawling
- [ ] XSS sanitization on HTML parsing
- [ ] Worker deployed and running (cron every 1min)
- [ ] Converted sync endpoints to async
- [ ] Feature flag `queue_ingest_enabled` defaults OFF

### Merge Target
- **Migrations**: `train/db-YYYYMMDD` → staging
- **Worker code**: `staging`

### Feature Flags
- `queue_ingest_enabled` - Route ingest to queue (default: OFF in staging)

---

## 📊 Branch 5: `feature/observability`

### What You CAN Touch ✅
- `tests/**` - All tests
- `scripts/audit/**` - Security/verification scripts
- `supabase/functions/_shared/logger.ts` - Logging utilities
- `.github/workflows/**` - CI/CD config
- `docs/**` - Runbooks, dashboards

### What You CANNOT Touch ❌
- Application logic (unless fixing bugs found in tests)
- UI components (unless adding test IDs)
- Migrations (unless adding metrics tables via train)

### Tasks Checklist (31 total)

#### Structured Logging (3 tasks)
- [ ] Add `request_id`, `org_id`, `actor_role` to all logs
- [ ] Use `createLogger` from `logger.ts` everywhere
- [ ] Ban `console.log` in CI (ESLint rule)

#### Metrics Collection (5 tasks)
- [ ] Per-org request rate
- [ ] Per-endpoint latency (P50/P95/P99)
- [ ] Queue depth by org
- [ ] TTS TTFB (time to first byte)
- [ ] Error rate by endpoint

#### Dashboards (4 tasks)
- [ ] Grafana/Datadog setup
- [ ] Real-time org activity dashboard
- [ ] SLA tracking (99.9% uptime)
- [ ] Cost attribution per org

#### Alerting (4 tasks)
- [ ] P95 latency > 500ms alert
- [ ] Error rate > 1% alert
- [ ] Queue depth > 1000 alert
- [ ] DLQ size > 50 alert

#### Testing (5 tasks)
- [ ] Tenant isolation tests (no cross-org leaks)
- [ ] k6 load tests (noisy neighbor scenarios)
- [ ] RLS policy verification
- [ ] Rate limit enforcement tests
- [ ] Feature flag security tests

#### Runbooks (5 tasks)
- [ ] TTS vendor outage response
- [ ] Queue backlog recovery
- [ ] Database migration rollback
- [ ] Security incident response
- [ ] High latency debugging

#### CI/CD Hardening (5 tasks)
- [ ] Block raw DB calls (check-tenant-guards.sh)
- [ ] Enforce tenant guard usage
- [ ] Run security audit on every PR
- [ ] Auto-rollback on critical alerts
- [ ] Slack notifications on failures

### Tenant Isolation Test Template
```typescript
// tests/integration/tenant-isolation.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Tenant Isolation', () => {
  it('prevents cross-org data leaks', async () => {
    // Setup: Two orgs with different users
    const orgA = await createTestOrg('Org A');
    const orgB = await createTestOrg('Org B');
    
    // Org A uploads private doc
    await uploadDoc(orgA, 'secret-A');
    
    // Org A can see it
    const resultA = await search(orgA, 'secret-A');
    expect(resultA.privateHits.length).toBeGreaterThan(0);
    
    // Org B CANNOT see it
    const resultB = await search(orgB, 'secret-A');
    expect(resultB.privateHits.length).toBe(0);
  });
  
  it('marketplace is visible to all', async () => {
    const orgA = await createTestOrg('Org A');
    const orgB = await createTestOrg('Org B');
    
    // Create public marketplace item
    await createMarketItem('public-item');
    
    // Both orgs can see marketplace
    const resultA = await search(orgA, 'public-item');
    const resultB = await search(orgB, 'public-item');
    
    expect(resultA.marketplaceHits.length).toBeGreaterThan(0);
    expect(resultB.marketplaceHits.length).toBeGreaterThan(0);
  });
});
```

### PR Checklist (Before Merge)
- [ ] All tests pass locally
- [ ] Added tests for new features
- [ ] Test coverage >80% (check with `npm run test:coverage`)
- [ ] Load test shows stable P95 under 1000 concurrent users
- [ ] Dashboards deployed and accessible
- [ ] Alerts configured in monitoring system
- [ ] Runbooks written and reviewed
- [ ] CI config validated (dry run)
- [ ] No flaky tests (run 10x to verify)

### Merge Target
`staging` (continuously, as tests are added)

### Feature Flags
None (observability is always-on)

---

## 🚂 Special Branch: `train/db-YYYYMMDD`

### Purpose
Coordinate all DB migrations to prevent conflicts.

### Process
1. Create train branch: `git checkout -b train/db-20251022 staging`
2. All DB PRs target this branch (not staging)
3. CI runs on train:
   - Spin up scratch Supabase
   - Apply all migrations
   - Run security audits
   - Run tenant isolation tests
4. If green → fast-forward merge to staging
5. Delete train branch, create new one for next day

### What Goes Here
- New tables/columns
- Index changes
- RLS policy updates
- Database functions
- Triggers

### CI Checks (Specific to Train)
```bash
#!/bin/bash
# scripts/audit/run-train-smoke.sh

echo "🚂 Running train smoke test..."

# 1. Create/reset scratch DB
supabase link --project-ref yalls-train-scratch
supabase db reset

# 2. Apply migrations
supabase db push

# 3. Verify RLS
psql "$TRAIN_DB" -f scripts/audit/verify-rls.sql

# 4. Run tenant isolation tests
npm run test:integration

# 5. Benchmark critical queries
npm run test:perf

echo "✅ Train smoke test passed!"
```

### Merge Rules
- **Requires**: All CI green + 2 approvals (infra + security)
- **Merge method**: Fast-forward only (no merge commits)
- **After merge**: Delete train branch, create tomorrow's train

---

## 🚀 Special Branch: `release/YYYY-MM-DD`

### Purpose
Canary deploy to production.

### Process
1. Staging bakes clean for 24-48h (no new commits, all tests green)
2. Cut release: `git checkout -b release/2025-10-24 staging`
3. Deploy to prod with canary:
   - 10% traffic → monitor 2h
   - 50% traffic → monitor 4h
   - 100% rollout
4. If any issues → rollback to previous release
5. If green → merge to main + tag

### Checklist Before Cutting Release
- [ ] Staging has been stable for 24-48h
- [ ] Zero critical bugs in staging
- [ ] All feature flags configured correctly
- [ ] Load tests passed (1000 concurrent users)
- [ ] Security audit passed (zero critical issues)
- [ ] Runbooks reviewed and up-to-date
- [ ] On-call rotation staffed
- [ ] Rollback plan documented

### Merge to Main
```bash
git checkout main
git merge --no-ff release/2025-10-24
git tag -a v1.2.3 -m "Release Oct 24, 2025"
git push origin main --tags
```

---

## 📋 Summary: Who Does What

| Branch | Owner | Duration | Can Touch | Cannot Touch |
|--------|-------|----------|-----------|--------------|
| **feature/ui-polish** | Frontend | 5 days | UI files only | Supabase, scripts |
| **feature/tenant-security** | Backend/Security | 7 days | Edge functions, RLS | UI, schema (via train) |
| **feature/search-isolation** | ML/Search | 6 days | Search API, indices (via train) | Other functions |
| **feature/job-queue** | Backend/Infra | 8 days | Workers, queue tables (via train) | UI, search |
| **feature/observability** | DevOps/QA | 10 days | Tests, CI, monitoring | App logic (unless bugs) |
| **train/db-YYYYMMDD** | Infra lead | 1 day | All migrations | Nothing else |
| **release/YYYY-MM-DD** | Release manager | 1-2 days | Nothing (cut only) | Everything (read-only) |

---

**Last Updated**: 2025-10-21  
**Next Review**: Daily standup
