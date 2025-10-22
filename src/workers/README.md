# Workers - Background Job Processors

## Purpose
Background workers for AI tasks, backups, retraining, and system maintenance.

## Planned Workers

### `durable_queue.ts` - Job Queue Manager
- Priority queue for AI tasks
- Retry logic with exponential backoff
- Dead letter queue for failed jobs
- Monitoring and alerts

### `ai_jobs_worker.ts` - AI Task Processor
- Processes queued AI tasks asynchronously
- Manages concurrent AI requests
- Tracks token usage and costs
- Reports metrics to monitoring

### `backup_worker.ts` - Database Backup Automation
- Scheduled database backups
- Compression and S3/R2 upload
- Retention policy enforcement
- Health check reporting

### `retrain_worker.ts` - Model Retraining Pipeline
- Collects feedback data
- Triggers retraining jobs
- Validates new model performance
- Deploys improved models

### `redteam_worker.ts` - Adversarial Testing
- Automated red-team testing
- Jailbreak attempt detection
- Safety guardrail validation
- Security audit reporting

## Job Schema
All workers report status to `ai_jobs` table:
```typescript
interface AIJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  retry_count: number;
  heartbeat_at: timestamp;
  result: json;
}
```

## Monitoring
- Heartbeat required every 30 seconds
- Jobs auto-fail after 5 minutes without heartbeat
- Metrics exported to `system_metrics` table
- Alerts on high failure rates

## Deployment
Workers run as cron-triggered edge functions in `supabase/functions/`.
