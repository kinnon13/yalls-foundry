# Andy's Cognitive Memory System

## Overview

Andy now has a complete cognitive scheduling system with:
- **Persistent task & iteration storage** - Multi-angle research over time
- **Memory decay & reinforcement** - Living memory that strengthens or fades
- **Semantic search** - Recall by meaning, not just keywords
- **Weekly reflections** - Self-generated journal entries about learning

## Architecture

```
User Request → Andy Chat → Brain Task Created
                              ↓
                     Scheduler (every minute)
                              ↓
                     Iteration Engine (5 angles)
                              ↓
                     Synthesizer (unify insights)
                              ↓
                     Brain Insights (with embeddings)
                              ↓
                Memory Decay (every 6h) + Reflection (weekly)
```

## Database Tables

### brain_tasks
Scheduled research/analysis tasks with:
- `task_name`, `goal` - What to research
- `interval_seconds` - Time between iterations
- `total_iterations` - How many angles to explore
- `current_iteration` - Progress tracker
- `status` - scheduled | running | complete | synthesized

### brain_iterations
Each perspective pass with:
- `task_id` - Parent task reference
- `angle` - Research perspective (technical, psychological, etc.)
- `summary` - Key findings from this angle
- `content` - Full research data

### brain_insights
Final synthesized knowledge with:
- `title`, `summary`, `full_text` - The insight content
- `key_points` - Extracted bullet points
- `embedding` - Vector for semantic search
- `memory_strength` - 0.0-1.0 (decays over time)
- `decay_rate` - How fast it fades
- `last_recalled_at` - When last accessed

### brain_reflections
Weekly self-analysis journal with:
- `report_date` - When generated
- `summary` - Andy's reflection text
- `reinforced_count`, `decayed_count`, `new_insights` - Stats

## Edge Functions

### 1. andy-scheduler
**Frequency:** Every minute  
**Purpose:** Checks for due tasks and triggers iterations

### 2. andy-iteration
**Triggered by:** Scheduler  
**Purpose:** Executes one research pass from a specific angle (5 angles total)

### 3. andy-synthesizer
**Triggered by:** Last iteration  
**Purpose:** Combines all perspectives into unified insight with embedding

### 4. andy-memory-decay
**Frequency:** Every 6 hours  
**Purpose:** Applies decay formula, checks weak memories for relevance, reinforces if still useful

### 5. andy-reflection
**Frequency:** Weekly (Mondays 9 AM)  
**Purpose:** Generates journal-style summary of memory changes

## Setup Instructions

### 1. Configure Cron Jobs

Add these to your Supabase project (via SQL editor or cron UI):

```sql
-- Every minute: Check for due tasks
SELECT cron.schedule(
  'andy-scheduler',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/andy-scheduler',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb
  ) as request_id;
  $$
);

-- Every 6 hours: Memory decay & reinforcement
SELECT cron.schedule(
  'andy-memory-decay',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/andy-memory-decay',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb
  ) as request_id;
  $$
);

-- Weekly (Mondays 9 AM): Reflection generation
SELECT cron.schedule(
  'andy-reflection',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/andy-reflection',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg"}'::jsonb
  ) as request_id;
  $$
);
```

### 2. View Cron Jobs

```sql
SELECT * FROM cron.job;
```

### 3. Remove Cron Jobs (if needed)

```sql
SELECT cron.unschedule('andy-scheduler');
SELECT cron.unschedule('andy-memory-decay');
SELECT cron.unschedule('andy-reflection');
```

## How to Use

### Create a Research Task

In Andy chat, say:
```
"Research equine AI marketing strategies. I want 5 different perspectives over the next hour."
```

Andy will use the `start_research_task` tool to:
1. Create a brain_task with 5 iterations
2. Set interval_seconds (e.g., 720 = 12 minutes)
3. Set next_run_at to start immediately

### Monitor Progress

The scheduler will automatically:
1. Trigger iterations every 12 minutes (or specified interval)
2. Each iteration researches from a different angle:
   - Technical trend analysis
   - Psychology / behavior
   - Economic data
   - Competitive intelligence
   - Cultural narrative

### View Results

Go to `/brain-insights` to see:
- **Memory Heatmap** - Visual grid showing strength of each insight
- **Memory Timeline** - Line chart of recall patterns
- **Weekly Reflection** - Andy's self-generated journal
- **All Insights** - Full list with key points

### Semantic Search (Future)

You can query insights by meaning:
```typescript
const { data } = await supabase.rpc('match_brain_insights', {
  query_embedding: [/* your embedding */],
  match_threshold: 0.78,
  match_count: 5
});
```

## Memory Behavior

### Decay
- All insights slowly lose strength over time based on `decay_rate`
- Default: 1% per day (0.01)
- Formula: `strength - (days_since_recall * decay_rate)`

### Reinforcement
- Every 6 hours, weak memories (< 25%) are checked for relevance
- If still relevant to recent tasks → strength boosted by 30%
- `last_recalled_at` updated

### Forgetting
- Memories below 20% strength are considered "cold"
- Can be archived or deleted in future versions

## Dashboard Components

### MemoryHeatmap
- Each square = one insight
- Color: Green (strong) → Red (fading)
- Glow border = recalled within 7 days
- Opacity = age (newer = brighter)

### MemoryTimeline
- Line chart of memory_strength over time
- X-axis: Last recalled date
- Y-axis: Strength percentage
- Hover for details

### WeeklyReflection
- Andy's self-generated journal entry
- Stats: reinforced, decayed, new insights
- Updated every Monday

## Frontend Integration

Add to your routes:
```tsx
import BrainInsights from '@/pages/BrainInsights';

// In router
<Route path="/brain-insights" element={<BrainInsights />} />
```

## API Endpoints (Future)

You can create these if needed:
- `GET /api/brain/insights` - List all insights
- `POST /api/brain/search` - Semantic search
- `GET /api/brain/reflections` - List reflections
- `POST /api/brain/task` - Create new research task

## System Benefits

✅ **Indefinite Chat History** - Already set to 500 messages  
✅ **Timer/Reminder System** - Uses `rocker_tasks` + `andy-check-reminders`  
✅ **Progressive Research** - Multi-iteration learning from different angles  
✅ **Living Memory** - Strengthens/fades based on relevance  
✅ **Self-Awareness** - Andy reflects on his own learning  
✅ **Semantic Recall** - Search by meaning, not keywords  

## Technical Details

### Embedding Model
- `text-embedding-3-small` (1536 dimensions)
- Generated for: title + summary + full_text
- Stored as pgvector

### AI Models Used
- Research: `openai/gpt-5-mini` (fast, cost-effective)
- Synthesis: `openai/gpt-5-mini`
- Embeddings: `text-embedding-3-small`

### RLS Policies
All tables are user-isolated:
- Users only see their own tasks
- Users only see their own insights
- Users only see their own reflections

## Monitoring

Check function logs:
```bash
# Scheduler logs
supabase functions logs andy-scheduler

# Iteration logs
supabase functions logs andy-iteration

# Synthesis logs
supabase functions logs andy-synthesizer

# Memory decay logs
supabase functions logs andy-memory-decay

# Reflection logs
supabase functions logs andy-reflection
```

## Future Enhancements

- [ ] Memory strength dashboard widget
- [ ] Manual memory reinforcement UI
- [ ] Export insights as markdown
- [ ] Insight categorization/tagging
- [ ] Memory graph visualization
- [ ] Cross-reference insights
- [ ] Memory consolidation (merge similar)
- [ ] Scheduled insight summaries via email

---

**Status:** ✅ Fully implemented and ready to use

All edge functions deploy automatically. Just set up the cron jobs and Andy's brain will start operating autonomously.
