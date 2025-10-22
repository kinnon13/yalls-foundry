# Monitoring & Observability

## Purpose
Telemetry configuration, alerting rules, and dashboard specifications for production monitoring.

## Planned Files

### `telemetry.ts` - OpenTelemetry Setup
- Trace collection configuration
- Span creation helpers
- Context propagation
- Export to monitoring backend

### `alerts.yaml` - Alert Definitions
- Critical alerts (paging)
- Warning alerts (notifications)
- Info alerts (logging)
- Threshold configurations

### `grafana_dashboard.json` - Dashboard Config
- Real-time metrics visualization
- Historical trend charts
- Alert status overview
- Cost tracking panels

## Key Metrics

### AI Performance
- `ai_command_rate` - Commands per minute
- `ai_plan_failure_rate` - % of plans that fail
- `ai_error_rate` - AI action errors (from `rocker-monitor` function)
- `ai_latency_p95` - 95th percentile response time

### System Health
- `queue_depth` - Pending jobs in `ai_jobs`
- `ai_cost_usd_total` - Total AI spend
- `ai_tokens_hourly` - Token consumption per hour
- `audit_activity_hourly` - Audit log volume

### Quality Metrics
- `shadow_win_rate` - % of A/B tests where new model wins
- `user_satisfaction` - Feedback scores
- `capability_coverage` - % of requests handled successfully

## Integration
- Metrics collected via `rocker-monitor` edge function (runs every 15 min)
- Stored in `system_metrics` table
- Exported to external monitoring (Sentry, Grafana Cloud)
- Alerts route to PagerDuty for critical issues

## Existing Monitoring
- `supabase/functions/rocker-monitor/index.ts` - Already deployed
- `supabase/functions/ai_health/index.ts` - Health check endpoint
- Records to `system_metrics` table
- Monitors queue depth, error rate, tokens, cost, audit activity

## Telemetry Baseline

### Load Testing AI Health Check
Run k6 load tests to baseline latency for each region:

```bash
k6 run tests/load/ai_healthcheck.js
```

Expected baseline metrics:
- **p50 latency**: < 50ms (database check)
- **p95 latency**: < 200ms (full health check)
- **p99 latency**: < 500ms (under load)
- **Error rate**: < 0.1%

### Health Check Response Format
```json
{
  "status": "ok" | "degraded" | "fail",
  "timestamp": "2025-01-15T00:00:00Z",
  "total_latency_ms": 150,
  "checks": [
    { "name": "database", "status": "ok", "latency_ms": 25 },
    { "name": "ai_action_ledger", "status": "ok" },
    { "name": "ai_brain_state", "status": "ok" },
    { "name": "system_metrics", "status": "ok" },
    { "name": "audit_log", "status": "ok" }
  ],
  "summary": {
    "total": 5,
    "ok": 5,
    "degraded": 0,
    "failed": 0
  }
}
```

### Monitoring Cadence
- Health check: Every 1 minute (ai_health function)
- System metrics: Every 15 minutes (rocker-monitor function)
- Load testing: Before each deployment
- Performance regression: Alert if p95 > 300ms
