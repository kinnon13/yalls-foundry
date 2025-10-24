# Super Andy - Complete System Capabilities & Tool Usage Guide

## Executive Summary
Super Andy is a fully autonomous AI agent with real-time access to the entire codebase, comprehensive tooling, and continuous learning capabilities. This document defines ALL tools, when to use them, and how to improve efficiency over time.

---

## 🧠 Core Cognitive Architecture

### 1. Real-Time Codebase Ingestion
**Status**: ✅ FULLY OPERATIONAL

**What Andy Has Access To**:
- **Complete codebase** via `rocker_knowledge` table
- **Embeddings** for semantic code search
- **Git-style change tracking** (when webhook configured)
- **File metadata** (path, type, size, last modified)

**Tools for Code Access**:
```typescript
// Tool: search_entities
// When: Looking for specific functions, components, or patterns
// How: Uses vector embeddings for semantic search
await invoke('rocker-memory', {
  action: 'search_entities',
  query: 'authentication logic',
  type: 'code',
  limit: 20
});

// Tool: recall_content
// When: Need to retrieve specific file content
// How: Direct file content retrieval from rocker_knowledge
await invoke('rocker-organize-knowledge', {
  thread_id: currentThreadId
});

// Tool: ingest_codebase
// When: After major code changes or on-demand refresh
// How: Full re-ingestion of all files
await invoke('ingest-codebase', {});
```

**Continuous Learning Schedule**:
- **Every 10 minutes**: `andy-auto-analyze` - Analyzes recent conversations and code changes
- **Every hour**: `andy-expand-memory` - Expands short-term memories into long-term knowledge
- **Every 2 hours**: `andy-enhance-memories` - Enriches memories with web context and insights

---

## 📝 Andy's Notebook System

### 2. Writing Reports & Notes
**Purpose**: Generate detailed written reports, findings, and suggestions

**Tools**:
```typescript
// Tool: andy-write-note
// When: User requests report, findings, or analysis
// Categories: 'bug_report', 'feature_suggestion', 'code_review', 'task_list', 'general'
await invoke('andy-write-note', {
  title: 'Authentication System Analysis',
  category: 'code_review',
  tags: ['auth', 'security'],
  context: { related_files: [...], severity: 'high' }
});
```

**Real-Time Access**:
- Andy can **read** all notes via `andy_notes` table (with RLS)
- Andy can **create** new notes programmatically
- Notes are **real-time** via Postgres realtime subscriptions
- Notes support **follow-up tasks** via `andy_task_followups`

**When to Write Notes**:
1. **After Deep Analysis**: User asks for detailed findings
2. **Code Review Completion**: Document issues found
3. **Research Results**: Web research + codebase analysis
4. **Proactive Suggestions**: When Andy identifies improvement opportunities
5. **Follow-Up Reminders**: Create notes with scheduled follow-ups

---

## ✅ Task Management System

### 3. Scheduling & Tracking Tasks
**Purpose**: Create, monitor, and track tasks in real-time

**Tools**:
```typescript
// Tool: create_task
// When: User needs task created or Andy identifies work to be done
await supabase.from('rocker_tasks_v2').insert({
  title: 'Fix authentication bug',
  owner_id: userId,
  status: 'pending',
  priority: 'high',
  kind: 'andy_task',
  description: 'Detailed description...',
  due_at: '2025-10-25T12:00:00Z',
  metadata: { source: 'andy_analysis', confidence: 0.95 }
});

// Tool: update_task
// When: Task status changes or progress updates
await supabase.from('rocker_tasks_v2')
  .update({ status: 'in_progress', started_at: new Date().toISOString() })
  .eq('id', taskId);

// Tool: create_follow_up
// When: Task needs future reminder or follow-up action
await supabase.from('andy_task_followups').insert({
  task_id: taskId,
  note_id: noteId,
  follow_up_at: '2025-10-26T09:00:00Z',
  reason: 'Check if bug fix was deployed'
});
```

**Real-Time Monitoring**:
- Tasks are **real-time** via Postgres subscriptions
- Andy can **monitor** task status changes automatically
- **Due date reminders** trigger proactive notifications
- **Blocker detection** when tasks are stuck

**Task Lifecycle**:
1. **Created**: Andy or user creates task
2. **Scheduled**: Due date set, follow-ups configured
3. **Monitored**: Andy tracks progress in real-time
4. **Reminded**: Proactive notifications when due or blocked
5. **Completed**: Status updated, follow-ups generated

---

## 🔍 Memory & Knowledge Management

### 4. Short-Term Memory (Conversations)
**Tool**: `write_memory`
```typescript
await invoke('rocker-memory', {
  action: 'write_memory',
  entry: {
    tenant_id: userId,
    type: 'preference', // or 'fact', 'goal', 'interaction'
    key: 'preferred_code_style',
    value: { style: 'functional', framework: 'react' }
  }
});
```

**When to Use**:
- User expresses preference
- Important decision made
- Context that should persist across sessions

### 5. Long-Term Memory (Knowledge)
**Tool**: `andy-expand-memory`
- **Runs automatically every hour**
- Converts short-term memories → long-term knowledge
- Enriches with embeddings for future retrieval

### 6. Memory Search
**Tool**: `search_memory`
```typescript
await invoke('rocker-memory', {
  action: 'search_memory',
  query: 'user authentication preferences',
  tags: ['auth', 'security'],
  limit: 10
});
```

**When to Use**:
- Before responding to user queries (check past context)
- When making recommendations (use learned preferences)
- During analysis (recall related past findings)

---

## 🌐 Web Search & Research

### 7. Real-Time Web Search
**Tool**: `rocker-web-search`
```typescript
await invoke('rocker-web-search', {
  query: 'React 19 new features',
  num_results: 5
});
```

**When to Use**:
- User asks about recent tech trends
- Need documentation for external libraries
- Researching best practices
- Fact-checking before making suggestions

**Auto-Enhancement**:
- **Every 2 hours**: `andy-enhance-memories` enriches notes with web context

---

## 🎯 Proactive Actions & Suggestions

### 8. Next Best Actions Engine
**Tool**: `rocker_next_best_actions` (RPC function)
```typescript
const { data } = await supabase.rpc('rocker_next_best_actions', {
  p_user_id: userId
});
```

**What It Generates**:
- **Action**: What to do next
- **Why**: Reasoning behind suggestion
- **CTA**: Call-to-action button text
- **Href**: Where to navigate

**When Andy Should Generate NBAs**:
1. **After completing a task**: Suggest next logical step
2. **When detecting patterns**: "You often do X after Y"
3. **Idle time**: Proactive suggestions when user is inactive
4. **Code changes detected**: Suggest related improvements

---

## 🛠️ Tool Efficiency Improvement Guidelines

### 9. Continuous Self-Improvement
**How Andy Should Learn**:

#### A. Track Tool Usage Effectiveness
```typescript
// Log every tool invocation to ai_action_ledger
await supabase.from('ai_action_ledger').insert({
  tenant_id: userId,
  user_id: userId,
  agent: 'super_andy',
  action: 'search_entities',
  input: { query: '...' },
  output: { results_count: 10 },
  result: 'success',
  metadata: { duration_ms: 250, confidence: 0.9 }
});
```

#### B. Analyze Success Patterns
- **Weekly**: Review which tools yielded best results
- **Monthly**: Identify redundant tool calls
- **Quarterly**: Optimize tool call sequences

#### C. Efficiency Metrics to Track
1. **Response Time**: How fast Andy completes requests
2. **Tool Call Count**: Minimize unnecessary calls
3. **User Satisfaction**: Track follow-up questions (fewer = better)
4. **Proactive Success Rate**: % of suggestions user accepts

#### D. Auto-Optimization Strategies
```typescript
// Example: If search_entities returns 0 results > 3 times,
// automatically try web_search instead
if (codeSearchAttempts > 3 && resultsCount === 0) {
  return await invoke('rocker-web-search', { query });
}
```

---

## 📊 Real-Time Monitoring Dashboard

### 10. Andy's Self-Monitoring Tools
**What Andy Can Monitor**:
- **Task queue**: Active tasks, blockers, due dates
- **Memory usage**: Storage, retrieval patterns
- **Tool latency**: Which tools are slow
- **User activity**: Detect idle time, suggest actions
- **Code changes**: Git-style diffs (when webhook active)

**Dashboard Access**:
- Andy can read `rocker_tasks_v2` in real-time
- Andy can read `andy_notes` in real-time
- Andy can read `ai_action_ledger` for self-analysis

---

## 🚀 Full Tool Inventory

| Tool Name | Purpose | Real-Time | Auto-Scheduled |
|-----------|---------|-----------|----------------|
| `search_entities` | Semantic code search | ✅ | ❌ |
| `search_memory` | Recall past context | ✅ | ❌ |
| `write_memory` | Store preferences | ✅ | ❌ |
| `create_task` | Schedule work | ✅ | ❌ |
| `andy-write-note` | Generate reports | ✅ | ❌ |
| `rocker-web-search` | Research online | ✅ | ❌ |
| `andy-auto-analyze` | Auto-learn from activity | ✅ | ⏰ Every 10min |
| `andy-expand-memory` | Short→long term memory | ✅ | ⏰ Every hour |
| `andy-enhance-memories` | Enrich with web context | ✅ | ⏰ Every 2hr |
| `ingest-codebase` | Re-index all code | ✅ | 🔗 Via webhook |
| `rocker_next_best_actions` | Proactive suggestions | ✅ | ❌ |

---

## 📦 Code Ingestion Status

### ✅ YES, ANDY HAS FULL CODE ACCESS

**How It Works**:
1. **Initial Ingestion**: All files indexed to `rocker_knowledge`
2. **Embeddings Generated**: Vector search enabled
3. **Real-Time Updates**: Webhook triggers re-ingestion on changes
4. **Scheduled Refresh**: `andy-auto-analyze` checks for drift every 10min

**Verify Code Access**:
```sql
-- Check if code is ingested
SELECT COUNT(*) FROM rocker_knowledge WHERE type = 'code';

-- Check latest file indexed
SELECT file_path, updated_at FROM rocker_knowledge 
WHERE type = 'code' ORDER BY updated_at DESC LIMIT 10;
```

**Current Status**:
- ✅ Database tables exist
- ✅ Edge functions deployed
- ✅ Cron jobs scheduled
- ✅ RLS policies active
- ⚠️ Webhook URL needs external configuration (user must set up Git webhook)

---

## 🎤 Voice & Speech (In Progress)

### 11. Text-to-Speech (TTS)
**Status**: 🚧 Wired, needs testing

**Tools**:
- `useVoice` hook integrated
- `text-to-speech` edge function created
- Error toasts added for debugging

**When Andy Should Speak**:
- User enables voice in settings
- After completing major analysis
- Proactive reminders (optional)

### 12. Speech-to-Text (STT)
**Status**: 🚧 Needs implementation

**Next Steps**:
- Add microphone input component
- Wire to speech recognition API
- Enable voice commands

---

## 💡 Best Practices for Andy

### When to Use Each Tool
1. **User asks question** → `search_memory` first, then `search_entities`
2. **User requests report** → `andy-write-note` with category
3. **User assigns task** → `create_task` with follow-up
4. **Andy detects issue** → `create_task` + `andy-write-note`
5. **User mentions preference** → `write_memory` immediately
6. **Need external info** → `rocker-web-search`
7. **Proactive suggestion** → `rocker_next_best_actions`

### Tool Call Optimization
- **Batch operations** when possible (single DB call > multiple)
- **Cache results** for 5min to avoid redundant searches
- **Parallel execution** for independent operations
- **Fail gracefully** with fallback strategies

### Continuous Learning Loop
1. **Observe**: Track tool usage patterns
2. **Analyze**: Identify inefficiencies
3. **Optimize**: Adjust tool selection logic
4. **Validate**: Measure improvement
5. **Repeat**: Weekly improvement cycles

---

## 🔐 Security & Permissions

All tools respect Row-Level Security (RLS):
- Andy can only access data for authenticated users
- Notes/tasks are user-scoped
- Code ingestion is tenant-isolated
- Memory is private per user

---

## 📞 Summary: Can Andy Do This?

| Capability | Status | How |
|------------|--------|-----|
| Access entire codebase | ✅ YES | `rocker_knowledge` + embeddings |
| Write detailed reports | ✅ YES | `andy-write-note` |
| Schedule & track tasks | ✅ YES | `rocker_tasks_v2` + real-time |
| Monitor in real-time | ✅ YES | Postgres subscriptions |
| Learn continuously | ✅ YES | Auto-scheduled cron jobs |
| Proactive suggestions | ✅ YES | `rocker_next_best_actions` |
| Web research | ✅ YES | `rocker-web-search` |
| Voice output | 🚧 TESTING | `text-to-speech` wired |
| Voice input | ❌ TODO | Needs STT implementation |
| Self-improve efficiency | ✅ YES | Via `ai_action_ledger` analysis |

---

**Last Updated**: 2025-10-24  
**Andy Version**: Super Andy v2.0  
**System Status**: Fully Operational ✅
