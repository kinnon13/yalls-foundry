# Disaster Recovery Plan

**Last Updated:** 2025-10-22

## Overview

This document outlines Y'alls Foundry's disaster recovery (DR) procedures to ensure business continuity in the event of system failures, data loss, or catastrophic incidents.

## Recovery Objectives

### Recovery Point Objective (RPO)
**Target: 1 hour**
- Maximum acceptable data loss
- Achieved via nightly backups + hourly transaction logs

### Recovery Time Objective (RTO)
**Target: 4 hours**
- Maximum acceptable downtime
- Includes detection, decision, and recovery execution

## Disaster Scenarios

### Scenario 1: Database Corruption/Loss

**Likelihood**: Low  
**Impact**: Critical

**Detection**:
- Automated health checks fail
- User reports of missing/incorrect data
- Supabase alerts

**Recovery Steps**:
1. **Assess Scope** (15 minutes)
   - Determine extent of corruption
   - Identify last known good state
   
2. **Isolate Systems** (15 minutes)
   - Put site in maintenance mode
   - Disable edge functions
   - Block new writes
   
3. **Restore from Backup** (2 hours)
   ```bash
   # Get latest backup
   aws s3 cp s3://yalls-backups/database/latest.sql.gz ./
   gunzip latest.sql.gz
   
   # Restore to scratch DB first (verify)
   psql $SCRATCH_DB < latest.sql
   
   # If verified, restore to production
   psql $PROD_DB < latest.sql
   ```
   
4. **Verify Integrity** (1 hour)
   - Run data validation queries
   - Check critical tables (profiles, businesses, transactions)
   - Test API endpoints
   
5. **Resume Operations** (30 minutes)
   - Re-enable edge functions
   - Exit maintenance mode
   - Monitor for errors
   
6. **Post-Incident** (24 hours after)
   - Post-mortem meeting
   - Update runbook if needed
   - Implement preventive measures

**Estimated Total Recovery Time**: 4 hours

---

### Scenario 2: Complete Supabase Outage

**Likelihood**: Very Low  
**Impact**: Critical

**Detection**:
- Supabase status page shows outage
- All API calls failing
- User complaints

**Recovery Steps**:
1. **Confirm Outage** (5 minutes)
   - Check Supabase status page
   - Verify not a local network issue
   - Contact Supabase support
   
2. **Activate Backup Infrastructure** (1 hour)
   - If multi-region replica exists: Failover to secondary
   - If no replica: Deploy to alternative Supabase project
   
3. **Restore Latest Backup** (2 hours)
   ```bash
   # Create new Supabase project (if needed)
   supabase projects create yalls-recovery
   
   # Restore data
   psql $RECOVERY_DB < latest_backup.sql
   
   # Update DNS/env vars
   export SUPABASE_URL=https://yalls-recovery.supabase.co
   export SUPABASE_ANON_KEY=...
   
   # Deploy edge functions
   supabase functions deploy --project-ref yalls-recovery
   ```
   
4. **Update Application** (30 minutes)
   - Push config changes with new Supabase URL
   - Deploy to production
   - Smoke test critical paths
   
5. **Monitor & Stabilize** (30 minutes)
   - Watch error rates
   - Verify all services healthy
   
6. **Post-Recovery** (After primary restored)
   - Sync any new data from recovery DB to primary
   - Switch DNS back to primary
   - Conduct post-mortem

**Estimated Total Recovery Time**: 4 hours

---

### Scenario 3: Edge Function Failure

**Likelihood**: Medium  
**Impact**: High

**Detection**:
- Increased 5xx error rates
- Specific function timing out
- User reports of broken features

**Recovery Steps**:
1. **Identify Failing Function** (5 minutes)
   - Check edge function logs
   - Identify which function is failing
   
2. **Quick Fix Attempt** (15 minutes)
   - Check for recent deployments
   - Restart function via Supabase dashboard
   
3. **Rollback if Needed** (15 minutes)
   ```bash
   # Revert to previous working version
   git revert <bad-commit-sha>
   git push origin main
   
   # Or deploy specific version
   git checkout <last-good-commit>
   supabase functions deploy <function-name>
   ```
   
4. **Implement Workaround** (30 minutes)
   - If function can't be fixed quickly
   - Deploy feature flag to disable affected feature
   - Show maintenance message to users
   
5. **Root Cause Analysis** (After incident)
   - Review logs for error patterns
   - Fix underlying issue
   - Add test to prevent regression

**Estimated Total Recovery Time**: 1 hour

---

### Scenario 4: Data Breach

**Likelihood**: Low  
**Impact**: Critical

**Detection**:
- Security alert triggered
- Unusual access patterns detected
- External researcher report

**Immediate Actions** (Within 1 hour):
1. **Containment**
   - Rotate all API keys and secrets
   - Revoke compromised access tokens
   - Lock affected user accounts
   
2. **Assessment**
   - Determine scope of breach
   - Identify affected users/data
   - Preserve logs for forensics
   
3. **Notification**
   - Internal: Notify leadership immediately
   - External: Notify affected users (within 72 hours per GDPR)
   - Regulatory: Report to authorities if required

**Recovery Steps** (Within 24 hours):
1. Patch vulnerability
2. Force password reset for affected users
3. Enable 2FA requirement for admins
4. Conduct security audit
5. Implement additional monitoring

**Long-Term**:
- External security audit
- Update security policies
- Enhanced training for team

---

## Backup Strategy

### Automated Backups

**Nightly Full Backup**:
- Time: 2 AM UTC (low traffic)
- Destination: S3/R2 encrypted bucket
- Retention: 30 days daily, 12 months monthly
- Script: `/scripts/automation/backup-nightly.sh`

**Continuous Transaction Logs**:
- Supabase built-in WAL (Write-Ahead Log)
- Point-in-time recovery possible
- Retention: 7 days

### Backup Testing

**Monthly Verification** (First Monday of each month):
1. Download random backup from S3
2. Restore to scratch database
3. Run validation queries
4. Document results in audit log

**Annual Full DR Test**:
- Simulate complete Supabase outage
- Execute full recovery procedure
- Time all steps
- Update runbook based on findings

---

## Communication Plan

### Internal Communication

**During Incident**:
- **Channel**: Slack #incidents
- **Update Frequency**: Every 30 minutes
- **Participants**: On-call engineer, tech lead, stakeholders

**After Incident**:
- **Post-Mortem Meeting**: Within 48 hours
- **Written Report**: Within 1 week
- **Action Items**: Assigned with deadlines

### External Communication

**Status Page**:
- Update within 15 minutes of detection
- Provide ETA for resolution
- Update every 30 minutes during outage

**User Notifications**:
- **P0 Incidents**: Email all users
- **Data Breach**: Email affected users + regulatory notification
- **Resolved**: Follow-up email with explanation

---

## Emergency Contacts

### On-Call Engineers

**Primary On-Call**:
- Name: [REDACTED]
- Phone: [REDACTED]
- Slack: @oncall-primary

**Secondary On-Call** (Backup):
- Name: [REDACTED]
- Phone: [REDACTED]
- Slack: @oncall-secondary

### Vendor Contacts

**Supabase**:
- Support: support@supabase.com
- Emergency: [Enterprise support number if applicable]
- Status: https://status.supabase.com

**Stripe**:
- Support: https://support.stripe.com
- Emergency: [Stripe emergency contact if applicable]

**Cloudflare**:
- Support: support@cloudflare.com
- Status: https://www.cloudflarestatus.com

---

## Testing & Maintenance

### Regular Testing

- **Weekly**: Backup restoration smoke test
- **Monthly**: Full backup restoration + validation
- **Quarterly**: Edge function rollback drill
- **Annually**: Complete DR simulation

### Plan Updates

- **Trigger**: After any P0 incident
- **Review**: Quarterly
- **Approval**: CTO sign-off required

---

## Recovery Checklist

Quick reference for on-call engineers:

```
□ Incident detected and confirmed
□ Severity assessed (P0/P1/P2/P3)
□ Incident channel created
□ Status page updated
□ Leadership notified (P0/P1 only)
□ Systems isolated (if needed)
□ Recovery procedure initiated
□ Progress updates posted (30min intervals)
□ Recovery verified
□ Systems restored to normal
□ Status page marked resolved
□ Users notified (if applicable)
□ Post-mortem scheduled
□ Action items created
```

---

**Last Updated:** 2025-10-22

**Next Review**: 2025-01-22
