# Rocker AI Learning & Management System

## Overview

Comprehensive system for tracking, analyzing, and improving Rocker's performance through multiple learning channels:

1. **Interaction Logging** - Every AI action tracked with pass/fail status
2. **Visual Learning** - User demonstrations when Rocker fails
3. **Web Knowledge Lookup** - Verified term definitions with peer voting
4. **Business KPIs** - Engagement trends, revenue, and AI success metrics
5. **Admin Analytics Dashboard** - Complete visibility into AI performance

## Architecture

### Database Tables

#### `ai_interaction_log`
Tracks every Rocker interaction with comprehensive metadata:
- `result_status`: success | failure | partial
- `tool_called`: Which tool was invoked
- `error_message`: What went wrong
- `user_correction`: How user corrected it
- `business_context`: Related business metrics

#### `visual_learning_events`
Captures when users show Rocker the correct way:
- `correction_type`: click_shown | type_shown | navigate_shown | other
- `action_attempted`: What Rocker tried
- `user_feedback`: User's explanation
- `metadata`: Additional context (coordinates, elements, etc.)

#### `term_knowledge`
External knowledge base with web verification:
- `term`: The term or concept
- `source_type`: user | web
- `source_url`: Web source if applicable
- `summary`: Definition/explanation
- `confidence_score`: Based on peer votes

#### `term_votes`
Peer verification of definitions:
- `vote`: -1 (down) or 1 (up)
- `confidence`: 1-5 rating
- Aggregated to update term confidence scores

#### `business_kpi_snapshots`
Daily business intelligence:
- `engagement_score`: User activity metrics
- `ai_success_rate`: Rocker performance
- `trends`: JSON tracking changes

## Usage

### Logging Interactions

```typescript
import { logInteraction } from '@/lib/ai/rocker/interaction-logger';

// After any Rocker action
await logInteraction({
  userId: session.userId,
  sessionId: rockerSessionId,
  interactionType: 'navigation',
  intent: 'Go to horses page',
  toolCalled: 'navigate',
  parameters: { path: '/horses' },
  resultStatus: success ? 'success' : 'failure',
  errorMessage: error?.message,
  userCorrection: 'User manually navigated instead'
});
```

### Recording Visual Corrections

```typescript
import { logVisualCorrection } from '@/lib/ai/rocker/interaction-logger';

// When user shows the correct way
await logVisualCorrection({
  userId: session.userId,
  sessionId: rockerSessionId,
  actionAttempted: 'Click submit button',
  correctionType: 'click_shown',
  userFeedback: 'The submit button is in the footer',
  metadata: {
    element: 'button#submit',
    coordinates: { x: 850, y: 600 },
    pageUrl: window.location.href
  }
});
```

### Term Lookup & Verification

```typescript
// Check if term is known
const { data } = await supabase.functions.invoke('term-lookup', {
  body: { term: 'jackpot', action: 'search' }
});

if (!data.found) {
  // Show clarification UI or search web
  // If user accepts definition:
  await supabase.functions.invoke('term-lookup', {
    body: {
      term: 'jackpot',
      action: 'accept',
      source_type: 'web',
      source_url: 'https://...',
      title: 'What is a jackpot?',
      summary: 'A jackpot is...'
    }
  });
}

// Peer voting
await supabase.functions.invoke('term-lookup', {
  body: {
    action: 'vote',
    term_knowledge_id: termId,
    vote: 'up' // or 'down'
  }
});
```

## Admin Dashboard

Access at `/admin/control-room` → **AI Analytics** tab

### Features

1. **Key Metrics Cards**
   - Total interactions
   - Success rate percentage
   - Visual corrections count
   - Known terms count

2. **Interactions Tab**
   - Recent 100 interactions with status icons
   - Tool usage breakdown with visual bars
   - Error messages and corrections inline
   - Filterable by status/tool

3. **Visual Learning Tab**
   - All user demonstrations
   - Correction types with badges
   - User feedback quotes
   - Chronological timeline

4. **Knowledge Base Tab**
   - All verified terms with confidence scores
   - Source type (user vs web) badges
   - Net vote scores
   - Links to original sources

5. **Trends Tab**
   - 7-day success rate chart
   - Improvement velocity metrics
   - Learning statistics

### Exporting Data

Click **Export** button to download JSON with:
- All statistics
- Recent interactions
- Visual learning events
- Term knowledge base
- Trend data

Perfect for external analysis tools or sharing with stakeholders.

## Learning Loop Integration

### In rocker-chat Edge Function

```typescript
// Get past learnings before responding
const learnedPatterns = await getLearnedPatterns(userId);
const recentFailures = await getRecentFailures(actionType);

// Add to system prompt
systemPrompt += `\n\nLearned patterns:\n${learnedPatterns}`;
systemPrompt += `\n\nRecent failures to avoid:\n${recentFailures}`;

// After tool call
await logInteraction({
  userId,
  intent: userMessage,
  toolCalled: toolName,
  resultStatus: toolResult.success ? 'success' : 'failure',
  errorMessage: toolResult.error
});

// If repeated failures, self-critique
if (failureCount >= 3) {
  return {
    message: "I've tried this 3 times unsuccessfully. Let me try a different approach...",
    suggestAlternative: true
  };
}
```

### Visual Correction Flow

1. **Rocker fails** → Action doesn't work as expected
2. **User demonstrates** → Shows correct click/type/navigation
3. **System captures** → Logs visual_learning_event with metadata
4. **Next attempt** → Rocker references past visual corrections for similar actions
5. **Success** → Confidence score increases, pattern reinforced

### Web Lookup Flow

1. **Unclear term** → Rocker doesn't understand concept
2. **Clarify** → "Do you mean X or Y?"
3. **Still unclear** → "Would you like me to search the web?"
4. **Search** → Finds authoritative source
5. **Propose** → "Is this what you mean? [link]"
6. **Accept** → Stores in term_knowledge
7. **Peer verify** → Other users vote to confirm
8. **Activate** → High-confidence definitions used automatically

## Business Intelligence

Daily KPI snapshots track:
- **User engagement**: Active users, session length, feature usage
- **AI performance**: Success rates, tool effectiveness
- **Revenue metrics**: Business growth correlated with AI improvements
- **Trend analysis**: Week-over-week changes

Query business intelligence:

```typescript
const { data } = await supabase
  .from('business_kpi_snapshots')
  .select('*')
  .gte('snapshot_date', startDate)
  .lte('snapshot_date', endDate)
  .order('snapshot_date');

// Analyze trends
const improvement = calculateTrendline(data.map(d => d.ai_success_rate));
const engagement = data[data.length - 1].engagement_score;
```

## Best Practices

### DO:
✅ Log every single interaction (success AND failure)  
✅ Include detailed error messages  
✅ Capture user corrections immediately  
✅ Record visual demonstrations with rich metadata  
✅ Update confidence scores based on peer feedback  
✅ Monitor trends daily to spot regressions  
✅ Export data regularly for offline analysis  

### DON'T:
❌ Skip logging on "minor" actions  
❌ Log PII or sensitive user data  
❌ Accept web sources without verification  
❌ Ignore repeated failures (self-critique threshold)  
❌ Let low-confidence terms pollute knowledge base  

## Privacy & Security

- **No raw audio/video** stored (transcripts only with opt-in)
- **PII scrubbing** on all logged data
- **RLS policies** ensure users only see their own data (admins see all)
- **Web sources** validated against allowlist
- **Peer voting** rate-limited to prevent abuse

## Future Enhancements

1. **Computer vision** - Actual screenshot analysis when user demonstrates
2. **Federated learning** - Aggregate patterns across users safely
3. **A/B testing** - Compare different learning strategies
4. **Predictive analytics** - Forecast which actions will fail
5. **Auto-remediation** - Automatically fix common failures
6. **Sentiment analysis** - Track user frustration levels

## Metrics That Matter

Key indicators of AI health:
- **Success rate** > 80% (target)
- **Visual correction rate** < 5% of interactions
- **Unknown term rate** < 2% of conversations
- **Improvement velocity** positive week-over-week
- **User corrections applied** > 90%

## Support

For issues or questions about the AI learning system:
1. Check admin dashboard for diagnostic data
2. Export analytics JSON for detailed review
3. Review recent visual learning events for patterns
4. Examine failed interactions for root causes
5. Monitor term knowledge for gaps

The system is designed to be self-improving - the more it's used with feedback, the better it gets!
