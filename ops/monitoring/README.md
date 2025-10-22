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
- Records to `system_metrics` table
- Monitors queue depth, error rate, tokens, cost, audit activity
