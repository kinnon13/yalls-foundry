# Andy's Learning System - Wiring Documentation

## 🚨 CURRENT STATUS: NOW FULLY AUTOMATED

### Previously Missing Triggers (FIXED)
1. ❌ **andy-auto-analyze** - was NOT scheduled → ✅ NOW runs every 10 minutes
2. ❌ **andy-expand-memory** - was NOT scheduled → ✅ NOW runs every hour
3. ❌ **andy-enhance-memories** - was NOT scheduled → ✅ NOW runs every 2 hours

### Real-time Codebase Monitoring
**NEW:** `andy-codebase-monitor` webhook receives code changes and triggers:
- `andy-learn-from-message` - analyzes the change
- `andy-expand-memory` - connects to existing knowledge
- `ingest-codebase` - updates full codebase documentation

**Webhook URL:** `https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/andy-codebase-monitor`

**Payload:**
```json
{
  "file_path": "src/components/NewComponent.tsx",
  "change_type": "created|modified|deleted",
  "content": "file contents...",
  "user_id": "optional-user-id"
}
```

## Learning Flow Architecture

### 1. Continuous Background Learning
```
Every 10 min → andy-auto-analyze → Scans all user memories → Generates insights
Every 1 hour → andy-expand-memory → Finds connections → Creates synthetic memories
Every 2 hours → andy-enhance-memories → Enriches existing memories → Cross-references
```

### 2. Conversation-Triggered Learning
```
User message → andy-chat → Saves message → Calls andy-learn-from-message → Extracts insights
```

### 3. Real-time Code Monitoring
```
Code change → Webhook call → andy-codebase-monitor → Triggers 3 analysis functions → Updates KB
```

### 4. Scheduled Deep Analysis
```
Every 4 hours → super-andy-learn-external → Web research → New knowledge acquisition
Every 2 hours → super-andy-learn-internal → Platform analytics → Optimization insights
```

## Configuration Files

### Cron Jobs: `supabase/config.toml`
Lines 454-483 define all Andy learning schedules.

### Edge Functions:
- **andy-chat** (`supabase/functions/andy-chat/index.ts`) - Main chat, calls learning after response
- **andy-learn-from-message** (`supabase/functions/andy-learn-from-message/index.ts`) - Deep message analysis
- **andy-auto-analyze** (`supabase/functions/andy-auto-analyze/index.ts`) - Background analysis loop
- **andy-expand-memory** (`supabase/functions/andy-expand-memory/index.ts`) - Memory connection builder
- **andy-codebase-monitor** (`supabase/functions/andy-codebase-monitor/index.ts`) - Real-time code watcher

### Database Tables:
- `rocker_knowledge` - Embedded knowledge chunks (Andy's searchable memory)
- `rocker_long_memory` - Persistent facts/preferences/goals
- `ai_action_ledger` - All AI actions logged here
- `ai_feedback` - User feedback on Andy's responses
- `embedding_jobs` - Queue for pending embeddings

## How to Verify It's Working

### 1. Check Cron Execution
```sql
SELECT jobname, last_run, next_run, active 
FROM cron.job 
WHERE jobname LIKE '%andy%';
```

### 2. Check Learning Activity
```sql
SELECT agent, action, created_at 
FROM ai_action_ledger 
WHERE agent = 'super_andy' 
ORDER BY created_at DESC 
LIMIT 20;
```

### 3. Check Knowledge Growth
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as chunks_created,
  COUNT(embedding) as embedded
FROM rocker_knowledge
WHERE meta->>'source' IN ('codebase_documentation', 'code_change', 'real_time_monitor')
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 4. Test Real-time Webhook
```bash
curl -X POST https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/andy-codebase-monitor \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "test.ts",
    "change_type": "modified",
    "content": "console.log(\"test\");",
    "user_id": "your-user-id"
  }'
```

## Troubleshooting

### Learning not triggering?
1. Check `supabase/config.toml` has cron schedules (lines 454-483)
2. Verify cron jobs are active in Supabase dashboard
3. Check edge function logs for errors

### Embeddings not generating?
1. Trigger manually: Call `generate-embeddings` function
2. Check `embedding_jobs` table for pending jobs
3. Verify OPENAI_API_KEY is set in secrets

### Webhook not working?
1. Ensure function is deployed (`andy-codebase-monitor`)
2. Check function logs for errors
3. Verify payload format matches spec above

## Next Steps for Full Automation

1. **Git Integration**: Hook into git post-commit to auto-call webhook
2. **File Watcher**: Monitor file changes in real-time during development
3. **Slack/Discord Bot**: Notify when Andy learns something new
4. **Dashboard**: Show Andy's learning activity in Super console
