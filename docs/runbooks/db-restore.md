# Database Restore Runbook

## 🎯 When to Use This

- Data corruption detected
- Accidental data deletion
- Migration gone wrong
- Need to recover to point-in-time

**⚠️ WARNING:** Database restores can take 30+ minutes and cause downtime. Always try other recovery methods first.

---

## 🔄 Recovery Options (Try in Order)

### Option 1: Undo via Application (Fastest)
If data was deleted via app:
```sql
-- Check if soft-delete used
SELECT * FROM table_name WHERE deleted_at IS NOT NULL;

-- Restore soft-deleted records
UPDATE table_name 
SET deleted_at = NULL 
WHERE id = 'record-id';
```

### Option 2: Query Historical Data
Supabase keeps change data capture (CDC) for limited time:
```sql
-- Check if record exists in audit table
SELECT * FROM audit_log WHERE table_name = 'your_table';

-- Restore from audit if possible
INSERT INTO your_table SELECT * FROM audit_log WHERE ...;
```

### Option 3: Point-in-Time Recovery (PITR)
**Contact Lovable Support** for PITR:
- Email: support@lovable.dev
- Subject: "URGENT: PITR Request for [Project Name]"
- Include:
  - Project ID: `xuxfuonzsfvrirdwzddt`
  - Target restore time (UTC)
  - Tables affected
  - Business justification

---

## 🧪 Pre-Restore Checks

Before requesting restore:

### 1. Verify Backup Exists
```sql
-- Check latest backup time
SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();

-- Verify backup window (should be < 24 hours old)
```

### 2. Calculate Downtime Window
- Backup size: ~[check dashboard]
- Estimated restore time: ~30-60 minutes
- User impact: [all users / specific features]

### 3. Prepare Rollback Plan
- Document current state
- Export critical data
- Prepare user communication

---

## 📋 Restore Procedure

### Phase 1: Pre-Restore (15 min)
1. **Enable Maintenance Mode**
   ```typescript
   // Set in environment
   VITE_MAINTENANCE_MODE=true
   ```

2. **Notify Users**
   - Post on status page
   - Send email to active users
   - Update social media

3. **Create Final Backup**
   ```bash
   # Via Lovable Cloud UI
   # Go to Project Settings > Database > Backups > Create Backup
   ```

4. **Document Current State**
   ```sql
   -- Export schema version
   SELECT version FROM supabase_migrations.schema_migrations 
   ORDER BY version DESC LIMIT 1;
   
   -- Export row counts
   SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
   FROM pg_stat_user_tables;
   ```

### Phase 2: Restore (30-60 min)
1. Contact Lovable Support with details
2. Monitor restore progress in dashboard
3. Do NOT make any changes during restore

### Phase 3: Verification (15 min)
1. **Check Schema**
   ```sql
   -- Verify migrations
   SELECT * FROM supabase_migrations.schema_migrations 
   ORDER BY version DESC LIMIT 10;
   
   -- Check table counts
   SELECT schemaname, tablename, n_live_tup
   FROM pg_stat_user_tables
   WHERE schemaname = 'public';
   ```

2. **Check Data Integrity**
   ```sql
   -- Verify critical tables
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM posts;
   SELECT COUNT(*) FROM events;
   
   -- Check referential integrity
   SELECT COUNT(*) FROM posts WHERE author_user_id NOT IN 
     (SELECT user_id FROM profiles);
   ```

3. **Test Critical Paths**
   - [ ] User can login
   - [ ] Posts load in feed
   - [ ] Can create new post
   - [ ] Notifications work
   - [ ] Payments process

### Phase 4: Post-Restore (15 min)
1. **Disable Maintenance Mode**
   ```typescript
   VITE_MAINTENANCE_MODE=false
   ```

2. **Monitor for Issues**
   - Check Sentry for error spikes
   - Monitor query performance
   - Watch user support tickets

3. **Notify Users**
   - "All systems operational"
   - Thank users for patience
   - Explain what was fixed

---

## 🔍 Restore Verification Queries

### Check User Data
```sql
-- Verify users exist
SELECT COUNT(*), MAX(created_at) FROM auth.users;

-- Check profiles
SELECT COUNT(*), MAX(created_at) FROM profiles;
```

### Check Content
```sql
-- Posts by date
SELECT 
  DATE(created_at) as date,
  COUNT(*) as posts
FROM posts
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;

-- Verify media attachments
SELECT COUNT(*) FROM posts WHERE media IS NOT NULL;
```

### Check Transactions
```sql
-- Orders
SELECT 
  status,
  COUNT(*),
  SUM(total_cents) as total
FROM orders
GROUP BY status;

-- Recent payments
SELECT * FROM orders 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

---

## 🚨 If Restore Fails

### Partial Restore (Some Data Lost)
1. Identify missing data scope
2. Determine if recoverable from logs
3. Communicate losses to users
4. Offer compensation if needed

### Complete Restore Failure
1. Escalate to Lovable engineering
2. Prepare for extended downtime
3. Consider manual data recreation
4. Document incident thoroughly

---

## 📊 Backup Schedule

### Automatic Backups
- **Frequency:** Daily at 2 AM UTC
- **Retention:** 7 days
- **Type:** Full database snapshot

### Manual Backups
- Before major migrations
- Before bulk data changes
- Before schema modifications

### Backup Verification
**Monthly drill** (first Monday of month):
```sql
-- Run restore drill to verify backups work
-- Test on separate staging environment
-- Document restore time
```

---

## 📝 Post-Restore Checklist

- [ ] All critical tables restored
- [ ] Row counts match expected
- [ ] User auth working
- [ ] RLS policies active
- [ ] Migrations at correct version
- [ ] Application functioning
- [ ] No error spikes in Sentry
- [ ] Users notified
- [ ] Incident documented
- [ ] Post-mortem scheduled

---

## 📞 Emergency Contacts

**Lovable Support:**
- Email: support@lovable.dev
- For database emergencies, use subject: "URGENT: Database Issue"

**Include in Request:**
- Project ID: `xuxfuonzsfvrirdwzddt`
- Issue description
- Business impact
- Preferred restore point (UTC timestamp)
