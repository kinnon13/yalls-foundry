# Rocker Initialization Guide

## Quick Start

Run this script to activate all Rocker proactive features:

```bash
deno run --allow-net --allow-env scripts/initialize-rocker.ts f6952613-af22-467d-b790-06dfc7efbdbd
```

## What Gets Configured

### 1. Voice Preferences
- ✅ Voice calls enabled
- ✅ Voice messages enabled  
- ✅ Preferred voice: 'alloy'

### 2. Runtime Flags
- ✅ `rocker.always_on` = true
- ✅ `rocker.daily_checkin` = 09:00 (9 AM)
- ✅ `rocker.evening_wrap` = 20:00 (8 PM)
- ✅ `rocker.task_nag` = 120 minutes
- ✅ `rocker.channel.web` = true
- ✅ `rocker.channel.sms` = false
- ✅ `rocker.channel.whatsapp` = false

### 3. Super Admin Settings
- ✅ Obedience level: balanced
- ✅ All permissions enabled:
  - Proactive suggestions
  - Memory ingest
  - Global knowledge write/publish
  - Hypothesis write
  - Change proposal create
  - Calendar access
  - Audit log
  - Entity management
  - Feature flag override

## Embedding Worker Issue

**Problem:** Uploads stay "pending"  
**Root Cause:** The `generate-embeddings` function requires `OPENAI_API_KEY`

### Solution: Add OpenAI API Key

1. **Get OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new secret key

2. **Add to Supabase:**
   ```
   Go to Lovable Cloud backend → Edge Functions → Secrets
   Add: OPENAI_API_KEY = your_key_here
   ```

3. **Verify it works:**
   ```sql
   -- Check pending embeddings
   SELECT COUNT(*) FROM rocker_knowledge WHERE embedding IS NULL;
   
   -- Wait 2 minutes (cron runs every 2 mins)
   -- Then check again
   SELECT COUNT(*) FROM rocker_knowledge WHERE embedding IS NULL;
   ```

The embedding worker runs **every 2 minutes** automatically via cron job.

## Verification Commands

```sql
-- Check voice preferences
SELECT * FROM voice_preferences 
WHERE user_id = 'f6952613-af22-467d-b790-06dfc7efbdbd';

-- Check runtime flags
SELECT * FROM runtime_flags 
WHERE flag_name LIKE 'rocker.%' 
ORDER BY flag_name;

-- Check super admin settings
SELECT * FROM super_admin_settings 
WHERE user_id = 'f6952613-af22-467d-b790-06dfc7efbdbd';

-- Check notifications
SELECT * FROM rocker_notifications 
WHERE user_id = 'f6952613-af22-467d-b790-06dfc7efbdbd' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check embedding progress
SELECT 
  COUNT(*) as total,
  COUNT(embedding) as embedded,
  COUNT(*) - COUNT(embedding) as pending
FROM rocker_knowledge;
```

## Testing Proactive Features

### Test Daily Check-in (Manual)
```sql
-- Trigger a check-in manually
SELECT rocker_dm(
  'f6952613-af22-467d-b790-06dfc7efbdbd',
  '☀️ Good morning! Ready to start your day?',
  'checkin',
  'web'
);
```

### Test Task Reminder
```sql
-- Create a task
INSERT INTO rocker_tasks (user_id, title, status)
VALUES ('f6952613-af22-467d-b790-06dfc7efbdbd', 'Test task', 'todo');

-- Send reminder
SELECT rocker_dm(
  'f6952613-af22-467d-b790-06dfc7efbdbd',
  '📋 You have 1 pending task: Test task',
  'task_reminder',
  'web'
);
```

## Troubleshooting

### No Proactive Messages?

1. **Check runtime flags exist:**
   ```sql
   SELECT * FROM runtime_flags WHERE flag_name LIKE 'rocker.%';
   ```
   Should return 7 rows

2. **Check cron jobs enabled:**
   - Look in `supabase/config.toml`
   - Should see `rocker-daily-tick`, `rocker-proactive-sweep`

3. **Check logs:**
   - View Lovable Cloud backend → Edge Functions → Logs
   - Look for `rocker-daily-tick` and `rocker-send-outbox`

### Scroll Not Working in Chat?

Fixed! The chat now uses `h-[70vh]` with proper ScrollArea height calculation.

### Still Have Pending Embeddings After 2 Minutes?

1. **Verify OPENAI_API_KEY is set** (see above)
2. **Check embedding_jobs table:**
   ```sql
   SELECT * FROM embedding_jobs 
   WHERE status = 'pending' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
3. **Manually trigger embedding worker:**
   ```sql
   -- Call the function directly
   SELECT net.http_post(
     url := 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/generate-embeddings',
     headers := '{"Content-Type": "application/json"}'::jsonb
   );
   ```

## Next Steps

After initialization:

1. ✅ **Wait for 9 AM** - Rocker will send daily check-in
2. ✅ **Upload content** - Add text/files to Vault
3. ✅ **Chat with memory** - Test knowledge retrieval
4. ✅ **Create tasks** - Get task reminders every 2 hours
5. ✅ **Wait for 8 PM** - Rocker will send evening wrap-up

## Support

If issues persist:
- Check all tables mentioned above
- Review edge function logs
- Verify cron jobs are enabled
- Ensure OPENAI_API_KEY is configured
