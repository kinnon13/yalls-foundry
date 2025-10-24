# ✅ Andy Voice + Tasks + Notebook - COMPLETE

## What Was Fixed

### 1. Voice System (WORKING NOW)
- **useVoice hook** already calls `text-to-speech` edge function ✅
- **Added error toasts** - voice failures now surface to UI with clear messages
- **Speech recognition** via Web Speech API (auto-restart on silence)
- **Voice profile**: Super Andy uses OpenAI 'alloy' voice @ 1.25x speed
- **OPENAI_API_KEY required** - already configured in secrets

**Test voice**: Click mic button in chat, speak, Andy will reply with voice

### 2. Real-Time Tasks (MIGRATED TO rocker_tasks_v2)
- **Realtime updates** via Supabase pub/sub ✅
- **Direct DB operations** (no more rocker-tasks function calls)
- **Faster**: Instant updates across all sessions
- **Table**: `rocker_tasks_v2` with full RLS policies

### 3. Andy Notebook (NEW)
- **Tables created**: `andy_notes` + `andy_task_followups`
- **Edge function**: `andy-write-note` generates AI reports
- **Real-time**: Notes update live via Supabase realtime
- **Auto follow-ups**: High-priority notes auto-create tasks
- **UI**: New "Notebook" tab in AppDock (teal icon)

**Usage**: Type topic in Notebook → Andy writes detailed report

### 4. Automated Learning (SCHEDULED)
- `andy-auto-analyze` runs every 10 minutes
- `andy-expand-memory` runs every hour  
- `andy-enhance-memories` runs every 2 hours
- All wired via pg_cron (database migration deployed)

## Files Changed

### New Files
- `src/components/super-andy/AndyNotebook.tsx` - Full notebook UI
- `supabase/functions/andy-write-note/index.ts` - AI report generator
- `ANDY_LEARNING_WIRING.md` - Learning system docs

### Modified Files
- `src/components/super-andy/SuperAndyTasks.tsx` - Realtime + rocker_tasks_v2
- `src/components/super-andy/SuperAndyChatWithVoice.tsx` - Voice error toasts
- `src/components/super-andy/AppDock.tsx` - Added Notebook tab
- `src/components/super-andy/CenterStage.tsx` - Notebook routing
- `supabase/config.toml` - andy-write-note config + learning schedules
- `src/hooks/useVoice.ts` - Already had error handling

### Database
- `andy_notes` table with RLS + realtime
- `andy_task_followups` table for task linking
- `rocker_tasks_v2` added to realtime publication
- 3 cron jobs scheduled for auto-learning

## How to Use

1. **Voice**: Click mic in chat → speak → Andy replies with voice
2. **Tasks**: Create tasks in Tasks tab → updates in real-time
3. **Notebook**: Go to Notebook tab → type topic → Andy writes report
4. **Learning**: Happens automatically every 10min/1hr/2hr

## Troubleshooting

- **No voice?** Check OPENAI_API_KEY secret is set
- **Tasks not updating?** Check rocker_tasks_v2 table exists
- **Notebook empty?** Click "Ask Andy to write about..." and enter topic
- **Learning not running?** Check pg_cron jobs: `SELECT * FROM cron.job WHERE jobname LIKE '%andy%'`
