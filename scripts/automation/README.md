# Automation Scripts

**Last Updated:** 2025-10-22

## Purpose

Automated scripts for backups, queue management, deployment verification, and operational tasks.

## Scripts

### backup-nightly.sh
**Purpose**: Nightly database backup with S3/R2 upload

**Usage**:
```bash
# Manual run
DATABASE_URL="postgres://..." ./scripts/automation/backup-nightly.sh

# With S3 upload
DATABASE_URL="postgres://..." \
AWS_ACCESS_KEY_ID="..." \
AWS_SECRET_ACCESS_KEY="..." \
S3_BUCKET="yalls-backups" \
./scripts/automation/backup-nightly.sh
```

**Cron Setup**:
```bash
# Add to crontab (runs at 2 AM daily)
0 2 * * * /path/to/scripts/automation/backup-nightly.sh
```

**Features**:
- Full pg_dump backup
- Gzip compression
- S3/R2 upload (if configured)
- Automatic cleanup (30-day retention)
- Webhook notification on completion

### retry-deadletter.ts
**Purpose**: Reprocess failed jobs from dead letter queue

**Usage**:
```bash
# Dry run (see what would be retried)
deno run -A scripts/automation/retry-deadletter.ts --dry-run

# Actually retry (default: 10 jobs)
deno run -A scripts/automation/retry-deadletter.ts

# Retry specific number of jobs
deno run -A scripts/automation/retry-deadletter.ts --limit=50
```

**What It Does**:
- Finds jobs with `status='error'` and `retry_count < 3`
- Resets them to `status='pending'`
- Increments retry counter
- Workers automatically process them

**Schedule**:
```bash
# Run every hour via cron
0 * * * * cd /path/to/project && deno run -A scripts/automation/retry-deadletter.ts >> /var/log/dlq-retry.log 2>&1
```

### verify-prod-health.sh
**Purpose**: Pre-deployment health check (blocks deploys if error rate too high)

**Usage**:
```bash
# Check production health
DATABASE_URL="postgres://..." ./scripts/automation/verify-prod-health.sh

# Custom thresholds
ERROR_THRESHOLD=1.0 WINDOW_MINUTES=30 ./scripts/automation/verify-prod-health.sh
```

**Exit Codes**:
- `0`: Health check passed, safe to deploy
- `1`: Health check failed, deployment blocked

**GitHub Actions Integration**:
```yaml
- name: Verify Production Health
  run: ./scripts/automation/verify-prod-health.sh
  env:
    DATABASE_URL: ${{ secrets.PROD_DB_URL }}
    ERROR_THRESHOLD: "0.5"  # 0.5%
    WINDOW_MINUTES: "15"    # Last 15 minutes
```

## Monitoring Integration

All automation scripts integrate with the monitoring system:

**Backup Success/Failure**:
- Recorded in `system_metrics` table
- Webhook notification sent (if configured)
- Failure triggers PagerDuty alert

**DLQ Retry Results**:
- Logged to `audit_log` table
- Metrics on retry success rate
- Alert if retry rate < 50%

**Health Check Results**:
- Recorded in `system_metrics` table
- Blocks CI/CD pipeline if failing
- Alert sent to #deploys Slack channel

## Environment Variables

### Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Postgres connection string | `postgres://user:pass@host:5432/db` |
| `SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJhbGci...` |

### Optional (Enhanced Features)

| Variable | Purpose | Example |
|----------|---------|---------|
| `AWS_ACCESS_KEY_ID` | S3 backup upload | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | S3 credentials | `wJalrXUtnFEMI/K7MDENG/...` |
| `S3_BUCKET` | Backup destination bucket | `yalls-backups` |
| `BACKUP_WEBHOOK_URL` | Backup notification | `https://hooks.slack.com/...` |
| `ERROR_THRESHOLD` | Max error rate % for deploys | `0.5` |
| `WINDOW_MINUTES` | Health check time window | `15` |

## Troubleshooting

### Backup Script Fails

**Check**:
1. `DATABASE_URL` is correct and accessible
2. Disk space available: `df -h`
3. PostgreSQL client installed: `pg_dump --version`
4. S3 credentials valid (if using cloud upload)

**Logs**:
```bash
# Run manually to see detailed output
./scripts/automation/backup-nightly.sh
```

### DLQ Retry Not Working

**Check**:
1. Deno is installed: `deno --version`
2. Supabase secrets configured
3. Workers are running to process retried jobs
4. Jobs aren't stuck due to permanent errors

**Debug**:
```bash
# Dry run to see what would be retried
deno run -A scripts/automation/retry-deadletter.ts --dry-run

# Check job statuses
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM ingest_jobs GROUP BY status;"
```

### Health Check False Positives

**Check**:
1. Error threshold too strict for your traffic
2. Time window too short (increase `WINDOW_MINUTES`)
3. Low traffic causing high variance

**Adjust Thresholds**:
```bash
# More lenient for low-traffic periods
ERROR_THRESHOLD=1.0 WINDOW_MINUTES=30 ./scripts/automation/verify-prod-health.sh
```

## Best Practices

### Backup Strategy
- **Frequency**: Nightly full backups + continuous WAL
- **Retention**: 30 days daily, 12 months monthly
- **Testing**: Monthly restoration test
- **Storage**: Encrypted S3 bucket with versioning

### Queue Management
- **Retry Logic**: Max 3 retries with exponential backoff
- **DLQ Review**: Weekly manual review of permanently failed jobs
- **Monitoring**: Alert if DLQ size > 50 jobs

### Deployment Safety
- **Always** run health check before production deploys
- Set error threshold based on normal baseline
- Include window long enough to detect anomalies (15+ minutes)
- Have rollback plan ready if check fails after deploy

## Adding New Automation

When creating new automation scripts:

1. **Location**: Place in `scripts/automation/`
2. **Naming**: Use kebab-case (e.g., `sync-feature-flags.sh`)
3. **Documentation**: Add entry to this README
4. **Error Handling**: Always use `set -euo pipefail` in bash scripts
5. **Logging**: Log to stdout (capture via cron or systemd)
6. **Secrets**: Use environment variables, never hardcode
7. **Testing**: Test locally before adding to cron

## Related Documentation

- [Production Hardening](../../docs/production/PRODUCTION_HARDENING.md)
- [Monitoring Setup](../../docs/production/MONITORING_SETUP.md)
- [DR Plan](../../docs/production/DR_PLAN.md)

---

**Last Updated:** 2025-10-22
