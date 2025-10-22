# Monitoring Setup Guide

**Last Updated:** 2025-10-22

## Overview

This guide documents the monitoring stack for Y'alls Foundry, including metrics, alerts, and dashboard configurations.

## Architecture

```
┌─────────────────┐
│  Edge Functions │──┐
│  (Supabase)     │  │
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌──────────────────┐
│  Database       │──┼───▶│ System Metrics   │
│  (Postgres)     │  │    │ Table            │
└─────────────────┘  │    └──────────────────┘
                     │             │
┌─────────────────┐  │             │
│  Workers        │──┘             │
│  (Background)   │                │
└─────────────────┘                │
                                   ▼
                        ┌──────────────────┐
                        │ Rocker Monitor   │
                        │ Edge Function    │
                        └──────────────────┘
                                   │
                                   ▼
                        ┌──────────────────┐
                        │  External Tools  │
                        │  • Sentry        │
                        │  • Grafana Cloud │
                        │  • PagerDuty     │
                        └──────────────────┘
```

## Core Metrics

### 1. AI System Metrics

**ai_error_rate**
- **Description**: Percentage of AI actions that failed
- **Source**: `ai_action_ledger` table
- **Calculation**: `(error_count / total_count) * 100`
- **Thresholds**:
  - OK: < 1%
  - Warning: 1-5%
  - Critical: > 5%

**ai_tokens_hourly**
- **Description**: Total tokens consumed per hour
- **Source**: `ai_action_ledger` table
- **Calculation**: `SUM(total_tokens)` where `created_at >= NOW() - INTERVAL '1 hour'`
- **Thresholds**:
  - Warning: > 1,000,000 tokens/hour

**ai_cost_hourly**
- **Description**: Total AI cost per hour (USD)
- **Source**: `ai_action_ledger` table
- **Calculation**: `SUM(cost_usd)` where `created_at >= NOW() - INTERVAL '1 hour'`
- **Thresholds**:
  - Warning: > $100/hour

### 2. Queue Metrics

**queue_depth**
- **Description**: Number of pending jobs in queue
- **Source**: `ingest_jobs` table
- **Calculation**: `COUNT(*)` where `status = 'pending'`
- **Thresholds**:
  - OK: < 100
  - Warning: 100-1000
  - Critical: > 1000

**queue_processing_time_p95**
- **Description**: 95th percentile processing time (seconds)
- **Source**: `ingest_jobs` table
- **Calculation**: `PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (completed_at - created_at))`
- **Thresholds**:
  - OK: < 30s
  - Warning: 30-60s
  - Critical: > 60s

### 3. Audit & Compliance Metrics

**audit_activity_hourly**
- **Description**: Number of audited actions per hour
- **Source**: `audit_log` table
- **Calculation**: `COUNT(*)` where `created_at >= NOW() - INTERVAL '1 hour'`
- **Purpose**: Detect unusual activity patterns

## Monitoring Edge Function

### Rocker Monitor

**Location**: `supabase/functions/rocker-monitor/index.ts`

**Schedule**: Runs every 5 minutes via cron job

**Setup Cron**:
```sql
SELECT cron.schedule(
  'rocker-monitor-5min',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := '[YOUR_SUPABASE_URL]/functions/v1/rocker-monitor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [YOUR_SERVICE_KEY]"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**What It Monitors**:
- Queue depth
- AI error rates
- Token usage
- Cost tracking
- Audit log activity

**Output**: Records metrics to `system_metrics` table

## External Integrations

### Sentry (Error Tracking)

**Setup**:
1. Create Sentry project at https://sentry.io
2. Add Sentry DSN to Supabase secrets:
   ```bash
   supabase secrets set SENTRY_DSN="your-dsn-here"
   ```
3. Add Sentry SDK to edge functions:
   ```typescript
   import * as Sentry from "https://esm.sh/@sentry/deno@7.0.0"
   
   Sentry.init({
     dsn: Deno.env.get("SENTRY_DSN"),
     tracesSampleRate: 0.1,
   })
   ```

**What to Track**:
- Edge function exceptions
- Rate limit violations
- Database connection errors
- External API failures

### Grafana Cloud (Dashboards)

**Setup**:
1. Sign up at https://grafana.com/products/cloud/
2. Create Postgres data source pointing to Supabase
3. Import dashboard from `/docs/production/grafana-dashboard.json`

**Recommended Dashboards**:

**Main Dashboard** - System Health Overview
- AI error rate (time series)
- Queue depth (gauge)
- Cost per hour (bar chart)
- Top error types (table)

**AI Dashboard** - AI Operations
- Token usage by model (pie chart)
- Cost breakdown by actor type (stacked bar)
- Response times (heatmap)
- Success rate by action (table)

**Queue Dashboard** - Background Jobs
- Queue depth trend (time series)
- Processing time P50/P95/P99 (line chart)
- Jobs by status (pie chart)
- DLQ size (gauge)

### PagerDuty (Alerting)

**Setup**:
1. Create PagerDuty service
2. Get integration URL
3. Add to Supabase secrets:
   ```bash
   supabase secrets set PAGERDUTY_URL="your-url-here"
   ```

**Alert Routing**:
- **Critical**: Page on-call engineer (SMS + voice call)
- **Warning**: Slack notification to #alerts
- **Info**: Logged only (no notification)

**Alert Rules**:
```typescript
// In rocker-monitor function
if (errorRate > 5) {
  await fetch(Deno.env.get("PAGERDUTY_URL"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      routing_key: Deno.env.get("PAGERDUTY_KEY"),
      event_action: "trigger",
      payload: {
        summary: `AI Error Rate Critical: ${errorRate}%`,
        severity: "critical",
        source: "rocker-monitor"
      }
    })
  })
}
```

## Dashboard Specifications

### Grafana Dashboard JSON

Create dashboard with these panels:

**Panel 1: AI Error Rate**
```sql
SELECT 
  DATE_TRUNC('minute', created_at) AS time,
  ROUND(
    (COUNT(*) FILTER (WHERE status != 'success')::NUMERIC / 
     NULLIF(COUNT(*), 0)::NUMERIC) * 100, 
    2
  ) AS error_rate
FROM ai_action_ledger
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY time
ORDER BY time ASC
```

**Panel 2: Queue Depth**
```sql
SELECT COUNT(*) AS queue_depth
FROM ingest_jobs
WHERE status = 'pending'
```

**Panel 3: Hourly AI Cost**
```sql
SELECT SUM(cost_usd) AS total_cost
FROM ai_action_ledger
WHERE created_at >= NOW() - INTERVAL '1 hour'
```

**Panel 4: Top Errors**
```sql
SELECT 
  action,
  COUNT(*) AS error_count,
  STRING_AGG(DISTINCT error_message, '; ') AS sample_errors
FROM ai_action_ledger
WHERE status != 'success'
  AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY action
ORDER BY error_count DESC
LIMIT 10
```

## Automated Reporting

### Daily Report

**Script**: `/scripts/reports/daily-health.sh`

**Schedule**: 9 AM UTC daily

**Contents**:
- Yesterday's AI usage summary
- Error rate trends
- Queue health
- Cost breakdown
- Top issues

**Recipients**: Engineering team via Slack #daily-reports

### Weekly Report

**Script**: `/scripts/reports/weekly-summary.sh`

**Schedule**: Monday 9 AM UTC

**Contents**:
- Week-over-week growth metrics
- Incident summary
- Performance trends
- Cost analysis
- Action items

**Recipients**: Leadership team via email

## Local Testing

Test monitoring stack locally:

```bash
# Start local Supabase
supabase start

# Populate test data
npm run seed:metrics

# Run monitor function locally
supabase functions serve rocker-monitor

# Trigger manually
curl http://localhost:54321/functions/v1/rocker-monitor \
  -H "Authorization: Bearer [YOUR_ANON_KEY]"

# View metrics
psql postgres://postgres:postgres@localhost:54322/postgres \
  -c "SELECT * FROM system_metrics ORDER BY recorded_at DESC LIMIT 10;"
```

## Troubleshooting

### No Metrics Appearing

**Check**:
1. Cron job is running: `SELECT * FROM cron.job;`
2. Edge function deployed: `supabase functions list`
3. Secrets configured: `supabase secrets list`
4. Network connectivity from Supabase to external services

### Incorrect Metric Values

**Debug**:
1. Query raw data: `SELECT * FROM ai_action_ledger WHERE created_at >= NOW() - INTERVAL '1 hour';`
2. Check calculation logic in monitor function
3. Verify time zones are consistent (UTC)

### Alerts Not Firing

**Check**:
1. PagerDuty integration URL correct
2. Alert thresholds configured properly
3. Monitor function completing successfully (check logs)

## Related Documentation

- [Production Hardening](./PRODUCTION_HARDENING.md)
- [Security Policy](./SECURITY_POLICY.md)
- [DR Plan](./DR_PLAN.md)

---

**Last Updated:** 2025-10-22
