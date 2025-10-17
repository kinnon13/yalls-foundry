# Feature Rollback Runbook

**Purpose:** Quickly disable or revert a feature causing production issues  
**Owner:** DevOps Team  
**Last Updated:** 2025-01-17

## When to Rollback

Rollback if any of these conditions occur:
- ❌ Error rate > 1% for 5+ minutes
- ❌ P95 latency > 500ms sustained
- ❌ User reports of data loss
- ❌ Feature causing cascading failures

## Quick Rollback (Feature Flags)

### Step 1: Kill Switch (Instant)

```typescript
// src/lib/feature-flags.ts
export const FLAGS = {
  profile_pins: { rollout: 0.0, kill_switch: true },  // ⚠️ Set to 0, enable kill switch
  favorites: { rollout: 0.0, kill_switch: true },
  // ... other features
};
```

**Impact:** Feature disabled for all users within 60 seconds (CDN cache)

### Step 2: Verify Feature Disabled

```bash
# Check production
curl https://app.example.com/api/flags | jq '.profile_pins'
# Should show: { "rollout": 0, "kill_switch": true }
```

### Step 3: Monitor Recovery

- Watch Sentry error rate drop
- Check Datadog latency graphs
- Verify user complaints stop

---

## Code Rollback (If Kill Switch Insufficient)

### Option A: Revert via Git

```bash
# 1. Find last good commit
git log --oneline -20

# 2. Revert problematic commit
git revert abc1234

# 3. Push to trigger deploy
git push origin main
```

**Deploy Time:** ~5 minutes

### Option B: Lovable History Restore

1. Open Lovable Editor
2. Navigate to History tab (Cmd/Ctrl + H)
3. Find last stable version
4. Click "Restore"
5. Verify changes
6. Deploy

**Deploy Time:** ~3 minutes

---

## Database Rollback (Dangerous!)

⚠️ **Only use if data corruption occurred**

### Step 1: Stop Writes

```sql
-- Revoke INSERT/UPDATE on affected table
REVOKE INSERT, UPDATE ON profile_pins FROM authenticated;
```

### Step 2: Restore from Backup

```bash
# 1. List available backups
supabase db dump --list

# 2. Restore specific table
supabase db restore --table=profile_pins --backup=2025-01-17-12-00

# 3. Verify row counts
psql -c "SELECT COUNT(*) FROM profile_pins;"
```

### Step 3: Re-enable Writes

```sql
GRANT INSERT, UPDATE ON profile_pins TO authenticated;
```

---

## Adapter Rollback (Mock ↔ DB)

### Switch to Mock Mode (Emergency)

```bash
# Set environment variable
export VITE_PORTS_MODE=mock

# Restart app
npm run build && npm run preview
```

**Impact:** All users use localStorage instead of database

### Switch to DB Mode (Post-Fix)

```bash
export VITE_PORTS_MODE=db
npm run build && npm run deploy
```

---

## Communication Plan

### Step 1: Alert Engineering

```slack
@channel 🚨 ROLLBACK IN PROGRESS

Feature: [profile_pins]
Reason: [Error rate spiked to 5%]
Action: [Kill switch enabled, rolling back code]
ETA: [5 minutes]
Status: [In Progress]
```

### Step 2: Update Status Page

```markdown
## Investigating: Profile Pins Disabled

We've temporarily disabled Profile Pins while we investigate an issue.
Your existing pins are safe and will reappear when we re-enable the feature.

Updates every 15 minutes.
```

### Step 3: Post-Mortem

File incident report within 24 hours:
- Root cause analysis
- Timeline of events
- Actions taken
- Preventative measures

---

## Verification Checklist

After rollback, verify:

- [ ] Error rate back to baseline (< 0.1%)
- [ ] Latency p95 < 200ms
- [ ] No new Sentry errors for rolled-back feature
- [ ] Users can still access app normally
- [ ] Database integrity intact (row counts match backup)
- [ ] Feature flag updated in codebase and deployed

---

## Prevention

To avoid future rollbacks:

1. **Feature Flags:** Always gate new features
2. **Gradual Rollout:** 5% → 10% → 25% → 50% → 100%
3. **Monitoring:** Set up alerts before full rollout
4. **Testing:** E2E tests must pass before deploy
5. **Canary Deploys:** Test on internal users first

---

## Contacts

- **On-Call Engineer:** Check PagerDuty
- **Database Admin:** #db-team Slack
- **DevOps Lead:** @devops-lead
- **CTO:** @cto (for P0 incidents only)

---

## Related Runbooks

- [Incident Response](./incident-response.md)
- [Database Restore](./db-restore.md)
- [Feature Flags Guide](./feature-flags.md)
