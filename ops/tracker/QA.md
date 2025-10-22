# Acceptance Playbook

## Overview
This document defines acceptance criteria for each major epic in the Super Andy AI system.

## Smoke Tests

### ai_health
- [ ] GET `/functions/v1/ai_health` returns status `ok|degraded|fail`
- [ ] Response includes component list with individual statuses
- [ ] Latency < 2s

### ai_eventbus  
- [ ] POST event accepted and stored in `ai_events` table
- [ ] Worker picks up event within 10s
- [ ] Event marked as `done` after processing

## Phase 2: Event Bus + Workers + Memory

### P2.1: Core Tables
- [ ] `ai_events` table exists with RLS enabled
- [ ] `ai_memory_core` table exists with pgvector extension
- [ ] `ai_context_cache` table exists
- [ ] `ai_perception_log` table exists
- [ ] All tables have `tenant_id` and optional `region` columns
- [ ] Cross-tenant queries blocked by RLS

### P2.2: Event Bus Edge Function
- [ ] `ai_eventbus` function accepts POST with event payload
- [ ] Events stored with idempotency key
- [ ] Duplicate events rejected
- [ ] Rate limiting enforced

### P2.3: Worker System
- [ ] Worker polls `ai_events` every 5s
- [ ] Routes events by `topic` to correct handler
- [ ] Marks events as `done` after processing
- [ ] Retries failed events with exponential backoff
- [ ] Dead letter queue for permanent failures

### P2.4: Manifest & Verification
- [ ] `brain.manifest.json` updated to version 2.0
- [ ] Verification script checks all Phase-2 tables exist
- [ ] Script prints ✅ for each component

### P2.5: Webhook Deprecation
- [ ] Internal AI calls use event bus instead of webhooks
- [ ] External integrations still use webhooks
- [ ] Migration document created

## Phase 2.5: Conversation Task Memory (CTM)

### P2.5.1: CTM Tables
- [ ] `ai_conversations` table with summaries
- [ ] `ai_messages` table with conversation_id FK
- [ ] `ai_goals` table with status tracking
- [ ] `ai_goal_steps` table with step-level progress
- [ ] `ai_bookmarks` table for tangent parking
- [ ] `ai_context_snapshots` table for resume
- [ ] `ai_daily_reports` table for morning recaps
- [ ] `ai_reminders` table for scheduled nudges
- [ ] All tables have RLS per-tenant
- [ ] Indices on `(tenant_id, user_id, status)`

### P2.5.2: Conversation Engine
- [ ] Send message → goal extracted and stored
- [ ] Topic switch → tangent detected → bookmark created
- [ ] Idle 10min → summarizer updates conversation.summary
- [ ] Resume → context snapshot restored

### P2.5.3: CTM Workers
- [ ] Summarizer runs every 10min for idle conversations
- [ ] Daily report generated at 7am America/Denver
- [ ] Reminders delivered at scheduled time
- [ ] All workers log to audit trail

### P2.5.4: UI Agenda Rail
- [ ] Agenda shows current topic + stack
- [ ] Open Tasks list shows top 5 goals with progress
- [ ] Bookmarks list shows parked tangents
- [ ] Resume button restores context snapshot
- [ ] Next-morning report displayed with resume suggestions

## Phase 3: Multi-Dimensional Reasoning (MDR)

### P3.1: MDR Tables
- [ ] Tables for perspectives, candidates, consensus, hypotheses, evidence, policy
- [ ] Pareto weights persisted per-tenant
- [ ] Policy weights configurable

### P3.2: MDR Planning Code
- [ ] `planMultiAngle()` returns winner plan
- [ ] Pareto frontier calculated
- [ ] Counterfactual analysis included
- [ ] Red-team critique generated
- [ ] Sanity loops prevent circular reasoning

### P3.3: Forensics UI
- [ ] Angle list shows all perspectives
- [ ] Candidates table with scores
- [ ] Pareto chart visualization
- [ ] Detailed view for each plan

## Phase 7: Multi-Region & Tenant Isolation

### P7.1: Tenant Fields & RLS
- [ ] All tables have `tenant_id` and `region`
- [ ] RLS blocks cross-tenant reads
- [ ] RLS blocks cross-region reads (optional)
- [ ] Per-tenant budget tracking

### P7.2: Quotas & Rate Limits
- [ ] Per-tenant token quotas enforced
- [ ] Per-tenant API rate limits enforced
- [ ] Load test: 2 tenants under stress, SLOs maintained
- [ ] Noisy neighbor isolation verified

### P7.3: DR & Replication
- [ ] Nightly backup worker runs successfully
- [ ] Backup restore tested and documented
- [ ] DR plan covers all critical tables
- [ ] RPO/RTO objectives defined

## Phase 8: Emotion & Self-Improvement

### P8.1: Emotion Engine
- [ ] Tone adapts to success signal (excited)
- [ ] Tone adapts to error signal (frustrated)
- [ ] Tone adapts to idle signal (curious)
- [ ] Tone adapts to praise signal (focused)

### P8.2: Capability Scanner & Curiosity
- [ ] Missing capabilities detected automatically
- [ ] Improvement tickets created in backlog
- [ ] Curiosity loop runs every 6 hours
- [ ] Open questions logged and researched

### P8.3: Daily Improvement Loop
- [ ] Daily self-assessment generated at 7am
- [ ] Report includes mood percentage breakdown
- [ ] Report identifies biggest obstacle
- [ ] Report proposes next research task
- [ ] Feedback loop updates reward weights

## Observability

### Metrics
- [ ] `ai_command_rate` tracked
- [ ] `ai_plan_failure_rate` tracked
- [ ] `queue_depth` tracked
- [ ] `ai_cost_usd_total` tracked
- [ ] `shadow_win_rate` tracked (if A/B testing)
- [ ] `latency_p95` < 2s for 95th percentile

### Alerts
- [ ] Critical alerts fire when thresholds exceeded
- [ ] Warning alerts fire before critical
- [ ] Alert routing configured (email, Slack, PagerDuty)

### Dashboards
- [ ] Grafana dashboard shows all metrics
- [ ] Real-time updates every 10s
- [ ] Historical view (7d, 30d, 90d)

## Refactors & Quality

### Code Quality
- [ ] All files < 300 LOC
- [ ] No behavior changes from refactors
- [ ] All tests pass after refactor
- [ ] No plaintext secrets in repo
- [ ] CI security scan passes

### Scripts
- [ ] Scripts organized by category (health/audit/validation/fixes/database)
- [ ] All scripts have help text
- [ ] Destructive scripts require confirmation

## Load Testing

### Scenarios
- [ ] 100 concurrent users, 5min duration, no errors
- [ ] 1000 events/sec, worker keeps up, no backlog
- [ ] 10 tenants, each sending 100 req/s, no cross-tenant leaks
- [ ] Failure injection: 1 tenant at 10x rate, others unaffected

### SLOs
- [ ] p95 latency < 2s under normal load
- [ ] p99 latency < 5s under normal load
- [ ] Error rate < 0.1% under normal load
- [ ] Uptime > 99.9% (measured monthly)

## Security

### Authentication
- [ ] All endpoints require valid JWT
- [ ] Service role key secured in environment
- [ ] User roles enforced (user/admin/super)

### Authorization
- [ ] RLS policies tested with different users
- [ ] Privilege escalation attempts blocked
- [ ] Audit log captures all sensitive actions

### Data Protection
- [ ] PII encrypted at rest
- [ ] Secrets managed via secure vault
- [ ] GDPR compliance verified (right to deletion)
- [ ] Data retention policies enforced
