# Cross-User Learning System

## Overview
The system automatically learns from ALL users and continuously improves by:
1. **Tracking every conversation** - Saves all messages in `rocker_conversations`
2. **Extracting patterns** - Automatically detects preferences, interests, and facts
3. **Comparing across users** - Aggregates patterns to find what works best
4. **Real-time updates** - Live dashboard updates when new data comes in

## How It Works for Every User

### 1. Automatic Learning (Per User)
When any user (including kinnonpeck@gmail.com) chats with Rocker:

```typescript
// Automatically triggered after EVERY conversation
extractLearningsFromConversation(userId, userMessage, aiResponse)
```

**What gets learned:**
- `I prefer X` → Saved as preference
- `My name is X` → Saved as personal_info
- `I'm working on X` → Saved as interest
- `I always X` → Saved as preference
- `Never X` → Saved as negative preference

**Storage:**
- Individual user patterns → `ai_user_memory` table
- Full conversations → `rocker_conversations` table

### 2. Cross-User Aggregation
After each conversation, the system aggregates patterns:

```sql
-- Finds patterns that multiple users share
SELECT key, type, COUNT(DISTINCT user_id) as user_count
FROM ai_user_memory
WHERE confidence >= 0.7
GROUP BY key, type
HAVING COUNT(DISTINCT user_id) >= 2
```

**Result:** Patterns used by 2+ users go into `ai_global_patterns`

### 3. User Analytics & Comparison
The system calculates how each user compares to others:

```sql
calculate_user_percentiles(user_id)
```

**Metrics tracked:**
- Memory count (how much AI knows about you)
- Interaction count (how often you chat)
- Success rate (how successful your interactions are)

**Storage:** `ai_user_analytics` table

### 4. Promoting to Global Knowledge
When a pattern is:
- Used by 5+ users
- Has 80%+ success rate

It gets promoted to `ai_global_knowledge` → Available to ALL users

## Real-Time Updates

The system uses Supabase Realtime to automatically update when:
- New memories are learned
- Conversations are saved
- Analytics are calculated
- Global patterns change

```typescript
// In KnowledgeBrowserPanel.tsx
supabase
  .channel('memory-updates')
  .on('postgres_changes', { table: 'ai_user_memory' }, handleUpdate)
  .subscribe()
```

## Database Tables

### Per-User Data
- `rocker_conversations` - Full chat history
- `ai_user_memory` - Individual learned patterns
- `ai_user_analytics` - Comparison metrics

### Cross-User Data
- `ai_global_patterns` - Aggregated patterns from all users
- `ai_global_knowledge` - Promoted best practices

## Manual Aggregation

Admins can manually trigger aggregation via the UI:
```typescript
// Calls edge function: aggregate-learnings
triggerAggregation()
```

Or via HTTP:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/aggregate-learnings
```

## How to View Your Data

Go to: `/admin/control-room` → Knowledge tab

You'll see:
1. **Your Profile** - Email and user ID (kinnonpeck@gmail.com)
2. **Learned Memories** - What Rocker knows about you
3. **Recent Conversations** - Your chat history
4. **Analytics** - How you compare to other users
5. **Global Patterns** - What successful users do

## Example Flow

1. **User 1 (kinnonpeck@gmail.com) says:** "I prefer email notifications"
   - ✅ Saved to `ai_user_memory`
   - ✅ Saved to `rocker_conversations`

2. **User 2 says:** "I prefer email notifications"
   - ✅ Saved to their `ai_user_memory`
   - ✅ Pattern aggregated → `ai_global_patterns` (2 users now)

3. **User 3, 4, 5 say the same**
   - ✅ Pattern promoted → `ai_global_knowledge`
   - ✅ Now ALL users get better email notification suggestions

4. **Analytics calculated for everyone:**
   - User 1: 15 memories, 80% success rate
   - User 2: 8 memories, 90% success rate
   - User 3: 25 memories, 75% success rate
   - etc.

## Benefits

### For Individual Users
- Personalized AI that learns YOUR preferences
- See what you've taught Rocker
- Track your conversation history

### For All Users
- Learn from successful users' patterns
- Get recommendations based on what works
- Continuous improvement as more people use the system

### For Admins
- Analytics on user engagement
- Pattern detection across the platform
- Ability to promote best practices globally

## Security & Privacy

- ✅ Users only see their own memories
- ✅ Users see aggregated patterns (not individual user data)
- ✅ Admins can view cross-user analytics
- ✅ All tables protected by Row-Level Security (RLS)

## Future Enhancements

1. **Clustering** - Group similar users and share patterns within clusters
2. **A/B Testing** - Test which patterns work best
3. **Personalized Recommendations** - "Users like you prefer..."
4. **Pattern Decay** - Downrank old patterns that stop working
5. **Success Prediction** - Predict which actions will succeed for each user