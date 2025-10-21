# Complete Work Breakdown (Remaining Tasks)

## 📊 Overview

| Category | Tasks | Priority | Est. Days | Risk |
|----------|-------|----------|-----------|------|
| **P0: Security** | 45 | 🔴 Critical | 7 | High |
| **P0: Infrastructure** | 28 | 🔴 Critical | 6 | Medium |
| **P1: UI/UX** | 67 | 🟡 High | 5 | Low |
| **P1: Features** | 23 | 🟡 High | 4 | Medium |
| **P2: Polish** | 31 | 🟢 Medium | 3 | Low |
| **TOTAL** | **194** | | **25 days** | |

**With 5 parallel streams: 2 weeks (10 working days)**

---

## 🔴 P0: Security & Tenant Isolation (45 tasks)

### Tenant Guard Migration (23 tasks)
*Stream 2: feature/tenant-security*

**Functions to migrate** (all must use `withTenantGuard`):
- [ ] rocker-chat
- [ ] rocker-organize-knowledge (partial - needs completion)
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

### RLS Policy Completion (12 tasks)
*Stream 2: feature/tenant-security*

**Add org_id + RLS to tables**:
- [ ] rocker_files
  - [ ] Add `org_id` column
  - [ ] Backfill from rocker_threads
  - [ ] Create RLS policies (SELECT/INSERT/UPDATE/DELETE)
  
- [ ] voice_events
  - [ ] Add `org_id` column
  - [ ] Backfill from user → org mapping
  - [ ] Create RLS policies
  
- [ ] rocker_memories
  - [ ] Add `org_id` column
  - [ ] Backfill from thread → org
  - [ ] Create RLS policies
  
- [ ] learning_entries
  - [ ] Add `org_id` column
  - [ ] Backfill from user → org
  - [ ] Create RLS policies

### Feature Flag Security (3 tasks)
*Stream 2: feature/tenant-security*

- [x] ~~Lock UPDATE to super_admin~~ (Done)
- [ ] Verify no client-side writes bypass RLS
- [ ] Add audit log for flag changes

### Admin Operations Audit (2 tasks)
*Stream 5: feature/observability*

- [ ] Hook up `admin_operations_audit` table to all service role queries
- [ ] Dashboard showing admin actions (who, what, when)

### CI Security Gates (5 tasks)
*Stream 5: feature/observability*

- [x] ~~Created `check-tenant-guards.sh`~~ (Done)
- [ ] Add to GitHub Actions (fail on violations)
- [ ] Add `verify-rls.sql` to CI
- [ ] Block merge if security audit fails
- [ ] Auto-comment PR with security warnings

---

## 🔴 P0: Infrastructure (28 tasks)

### Dual Search Implementation (10 tasks)
*Stream 3: feature/search-isolation*

**Data Migration**:
- [ ] Identify current embedding storage location
- [ ] Write migration script: knowledge_chunks → private_chunks
- [ ] Backfill `private_chunks` with org_id
- [ ] Create public listing embeddings → market_chunks
- [ ] Verify zero data loss

**Index Optimization**:
- [ ] Create ivfflat index on private_chunks (tune `lists` param)
- [ ] Create ivfflat index on market_chunks
- [ ] Benchmark query performance (target: P95 < 200ms)

**API Updates**:
- [ ] Update `kb-search` to call dual RPCs
- [ ] Merge private + marketplace results with scoring
- [ ] Add telemetry (private vs market query ratio)

### Job Queue & Workers (11 tasks)
*Stream 4: feature/job-queue*

**Processors**:
- [ ] Embedding processor
  - [ ] Batch OpenAI API calls (100 chunks/batch)
  - [ ] Handle rate limits (429 retry)
  - [ ] Store in private_chunks with org_id
  
- [ ] Crawl processor
  - [ ] URL fetching (with timeout + SSRF protection)
  - [ ] HTML parsing (sanitize XSS)
  - [ ] Chunk + embed → queue embed job
  
- [ ] OCR processor
  - [ ] Image → text (OCR.space or Tesseract)
  - [ ] Chunk + embed → queue embed job
  
- [ ] PDF processor
  - [ ] Extract text (pdf-parse)
  - [ ] Chunk + embed → queue embed job

**Infrastructure**:
- [ ] Per-org concurrency enforcement (verify claim_ingest_job)
- [ ] Dead letter queue (DLQ) for failed jobs
- [ ] Retry logic with exponential backoff
- [ ] Idempotency key deduplication
- [ ] Worker deployment (edge function cron or Fly.io)

**Conversion to Async**:
- [ ] `kb-ingest` → enqueue instead of sync embed
- [ ] `ingest-upload` → enqueue OCR/parse

### Rate Limiting (4 tasks)
*Stream 2: feature/tenant-security*

**Enforcement**:
- [ ] TTS endpoints (600/min per org)
- [ ] Embeddings endpoints (1000/min per org)
- [ ] Crawl endpoints (10/min per org)
- [ ] Admin RPCs (100/min per user)

### Monitoring Setup (3 tasks)
*Stream 5: feature/observability*

- [ ] Set up metrics collection (Prometheus/Datadog)
- [ ] Create dashboards (P95 latency, queue depth, error rate)
- [ ] Configure alerts (latency > 500ms, error rate > 1%)

---

## 🟡 P1: UI/UX (67 tasks)

### Onboarding Flow (8 tasks)
*Stream 1: feature/ui-polish*

- [ ] Fix broken onboarding page (currently errors on load)
- [ ] Add progress indicator (steps 1/2/3)
- [ ] Org creation wizard
- [ ] Role selection (user/admin)
- [ ] Welcome tour (interactive highlights)
- [ ] Skip button for returning users
- [ ] Mobile-responsive layout
- [ ] Loading states for async steps

### Voice Interface (12 tasks)
*Stream 1: feature/ui-polish*

- [ ] Waveform animation during recording
- [ ] Visual feedback for voice activity detection
- [ ] Loading spinner during TTS generation
- [ ] Error states (mic permission denied, TTS failed)
- [ ] Voice settings panel (speed, pitch?)
- [ ] Push-to-talk vs always-on toggle
- [ ] Mobile voice UI (large tap targets)
- [ ] Mute/unmute controls
- [ ] Volume slider
- [ ] Transcript display (real-time)
- [ ] Export transcript button
- [ ] Voice command help modal

### Knowledge Base UI (9 tasks)
*Stream 1: feature/ui-polish*

- [ ] Search bar with autocomplete
- [ ] Filter by category/date/author
- [ ] Card view + list view toggle
- [ ] Inline preview on hover
- [ ] Markdown rendering with syntax highlighting
- [ ] Empty state (no results)
- [ ] Skeleton loaders for search results
- [ ] Infinite scroll pagination
- [ ] Quick actions (edit, delete, share)

### Navigation & Layout (7 tasks)
*Stream 1: feature/ui-polish*

- [ ] Responsive sidebar (collapse on mobile)
- [ ] Breadcrumbs for nested pages
- [ ] Global search (CMD+K)
- [ ] User menu (profile, settings, logout)
- [ ] Notification bell with unread count
- [ ] Quick switcher (orgs, threads)
- [ ] Footer with links

### Forms & Inputs (8 tasks)
*Stream 1: feature/ui-polish*

- [ ] Consistent form validation (Zod + react-hook-form)
- [ ] Error messages inline + toast
- [ ] Loading states on submit buttons
- [ ] Disabled states with tooltips
- [ ] Autosave drafts (debounced)
- [ ] Rich text editor (Tiptap or Slate)
- [ ] File upload with drag-drop + progress
- [ ] Multi-select with chips

### Responsive Design (6 tasks)
*Stream 1: feature/ui-polish*

- [ ] Mobile layout (all pages)
- [ ] Tablet layout (breakpoint 768px)
- [ ] Touch targets ≥44px
- [ ] Swipe gestures (threads, modals)
- [ ] Bottom nav on mobile
- [ ] Responsive tables (horizontal scroll)

### Dark Mode (4 tasks)
*Stream 1: feature/ui-polish*

- [ ] Audit all components for dark mode contrast
- [ ] Fix white text on white bg issues
- [ ] Toggle animation (smooth transition)
- [ ] System preference detection

### Loading & Empty States (5 tasks)
*Stream 1: feature/ui-polish*

- [ ] Skeleton loaders (threads, messages, KB items)
- [ ] Empty state illustrations (zero threads, no results)
- [ ] Loading overlay for full-page operations
- [ ] Progress bars for long operations (embedding, crawl)
- [ ] Retry button on errors

### Accessibility (8 tasks)
*Stream 1: feature/ui-polish*

- [ ] Keyboard navigation (tab order, focus traps)
- [ ] ARIA labels on all interactive elements
- [ ] Screen reader testing
- [ ] Color contrast ratio ≥4.5:1 (WCAG AA)
- [ ] Focus indicators visible
- [ ] Skip to main content link
- [ ] Alt text on all images
- [ ] Error announcements via live regions

---

## 🟡 P1: Features (23 tasks)

### Admin Dashboard (6 tasks)
*Stream 1: feature/ui-polish*

- [ ] Org-wide analytics (active users, usage)
- [ ] User management table (invite, remove, change role)
- [ ] Feature flag toggles (UI for super_admin)
- [ ] System health status
- [ ] Recent activity feed
- [ ] Export data button

### Thread Management (4 tasks)
*Stream 1: feature/ui-polish*

- [ ] Archive threads
- [ ] Search within thread
- [ ] Export thread as PDF/Markdown
- [ ] Share thread (public link with expiry)

### AI Personas (5 tasks)
*Stream 4: feature/job-queue* (depends on dynamic_personas_enabled flag)

- [ ] Persona creation UI (name, voice, tone)
- [ ] Persona selector in thread
- [ ] Persona avatar customization
- [ ] Persona memory (context per persona)
- [ ] Persona analytics (usage, ratings)

### Marketplace (4 tasks)
*Stream 3: feature/search-isolation*

- [ ] Browse public knowledge items
- [ ] One-click import to private KB
- [ ] Contributor profiles
- [ ] Rating + review system

### Notifications (4 tasks)
*Stream 5: feature/observability*

- [ ] In-app notification center
- [ ] Email notifications (digest + real-time)
- [ ] Push notifications (web + mobile)
- [ ] Notification preferences panel

---

## 🟢 P2: Polish & Optimization (31 tasks)

### Performance (8 tasks)
*Stream 5: feature/observability*

- [ ] Code splitting (React.lazy on routes)
- [ ] Image optimization (next/image or sharp)
- [ ] Bundle size audit (<500kb initial)
- [ ] Lighthouse score >90
- [ ] Preload critical fonts
- [ ] Lazy load off-screen images
- [ ] Memoize expensive computations
- [ ] Virtual scrolling for long lists (react-window)

### Error Handling (5 tasks)
*Stream 5: feature/observability*

- [ ] Global error boundary with fallback UI
- [ ] Sentry integration (error tracking)
- [ ] User-friendly error messages (no stack traces)
- [ ] Retry mechanisms on network failures
- [ ] Offline mode detection + banner

### Testing (10 tasks)
*Stream 5: feature/observability*

- [ ] Unit tests (80% coverage target)
- [ ] Integration tests (tenant isolation)
- [ ] E2E tests (Playwright - critical flows)
- [ ] Visual regression tests (Percy or Chromatic)
- [ ] Load tests (k6 - 1000 concurrent users)
- [ ] Security tests (OWASP Top 10)
- [ ] Accessibility tests (axe-core)
- [ ] Performance tests (Lighthouse CI)
- [ ] API contract tests (Pact)
- [ ] Chaos engineering (inject failures)

### Documentation (5 tasks)
*Stream 5: feature/observability*

- [ ] API docs (OpenAPI spec)
- [ ] User guide (end-user facing)
- [ ] Developer docs (onboarding new engineers)
- [ ] Runbooks (incident response)
- [ ] Architecture diagrams (C4 model)

### Animation & Delight (3 tasks)
*Stream 1: feature/ui-polish*

- [ ] Micro-interactions (button hover, card flip)
- [ ] Page transitions (framer-motion)
- [ ] Confetti on milestones (first thread, 100th message)

---

## 📈 Progress Tracking

### Daily Standup Questions
1. What did you ship yesterday?
2. What are you shipping today?
3. Any blockers? (tag for help)

### Weekly Metrics
- **Velocity**: Tasks completed per day per stream
- **Merge Rate**: PRs merged to staging per day
- **Bug Escape Rate**: Bugs found in staging vs prod
- **Test Coverage**: % of code covered by tests
- **CI Pass Rate**: % of PRs passing all checks

### Definition of Done
A task is "done" when:
- [ ] Code written + reviewed
- [ ] Tests pass (unit + integration)
- [ ] CI green (lint, typecheck, security audit)
- [ ] Deployed to staging
- [ ] QA verified (manual spot check)
- [ ] Docs updated (if applicable)

---

## 🚀 Quick Wins (Ship Today)

These can be done independently in <2 hours each:

1. **Fix onboarding page crash** (Stream 1)
2. **Add loading spinner to voice button** (Stream 1)
3. **Create empty state for knowledge base** (Stream 1)
4. **Add breadcrumbs to all pages** (Stream 1)
5. **Ban console.log in CI** (Stream 5)
6. **Add request_id to all logs** (Stream 5)
7. **Create PRODUCTION_HARDENING.md** (Stream 5) ✅ Done
8. **Write first tenant isolation test** (Stream 5)
9. **Migrate rocker-chat to withTenantGuard** (Stream 2)
10. **Add rate limit to TTS endpoint** (Stream 2)

---

**Last Updated**: 2025-10-21  
**Estimated Completion**: 2025-11-04 (2 weeks with 5 parallel streams)
