# Rocker Knowledge Base System

## Overview

The Knowledge Base (KB) system enables Rocker to learn from structured documentation, playbooks, and terminology. It provides semantic search, intent-based workflows, and term resolution to make Rocker smarter over time.

## Architecture

### Core Tables

#### `knowledge_items`
Main content units with metadata and embeddings:
- `uri`: Unique identifier (e.g., `global://entities/profiles/types`)
- `scope`: `global` (all users) | `site` (authenticated) | `user` (owner only)
- `category`/`subcategory`: Hierarchical organization
- `embedding`: Vector for semantic search
- `tags`: Flexible categorization

#### `knowledge_chunks`
Searchable text segments (1500 chars with 200 char overlap):
- `item_id`: Parent knowledge item
- `idx`: Chunk order
- `text`: Actual content
- `embedding`: Vector for fine-grained search

#### `term_dictionary`
Semantic term resolution with synonyms:
- `term`: Primary term
- `synonyms`: Alternative names
- `definition`: Short explanation
- `term_knowledge_id`: Link to verified term_knowledge

#### `playbooks`
Intent-based workflows:
- `intent`: What user wants to do
- `steps`: Ordered actions
- `required_slots`: Parameters needed
- `ask_templates`: Clarification prompts

## Edge Functions

### POST /kb-ingest
Ingests markdown content with YAML front-matter.

**Input:**
```json
{
  "content": "---\ntitle: Horse Types\ncategory: entities\nscope: global\n---\n# Content...",
  "uri": "global://entities/profiles/horse/types",
  "tenant_id": "optional-uuid-for-user-scope"
}
```

**Process:**
1. Parse YAML metadata
2. Extract body content
3. Generate embedding (title + first 500 chars)
4. Chunk body text (1500 chars, 200 overlap)
5. Generate embeddings for each chunk
6. Extract playbook if `intent:` found
7. Store all in database

**Output:**
```json
{
  "success": true,
  "item_id": "uuid",
  "chunks": 5
}
```

### POST /kb-search
Hybrid keyword + semantic search.

**Input:**
```json
{
  "q": "create event",
  "scope": "site",
  "category": "workflows",
  "tags": ["events"],
  "limit": 10,
  "semantic": true
}
```

**Process:**
1. Keyword search on titles (PostgreSQL text search)
2. Generate query embedding
3. Vector similarity search on chunks
4. Merge results (hybrid ranking)
5. Return top N items

**Output:**
```json
{
  "results": [
    {
      "id": "uuid",
      "uri": "site://workflows/create-event",
      "title": "Create Event Guide",
      "summary": "Step-by-step...",
      "match_type": "hybrid",
      "knowledge_chunks": [...]
    }
  ],
  "total": 10,
  "query": "create event"
}
```

### GET /kb-item?uri=...
Fetch single item with all chunks.

**Output:**
```json
{
  "item": {
    "id": "uuid",
    "uri": "global://entities/profiles/types",
    "title": "Profile Types",
    "knowledge_chunks": [
      { "idx": 0, "text": "..." },
      { "idx": 1, "text": "..." }
    ]
  }
}
```

### GET /kb-related?uri=...&limit=8
Find semantically similar items.

**Process:**
1. Get source item embedding
2. Vector similarity search
3. Filter out source item
4. Return top K neighbors

**Output:**
```json
{
  "related": [
    { "id": "uuid", "title": "Horse Subcategories", "similarity": 0.85 },
    { "id": "uuid", "title": "Breeding Guide", "similarity": 0.78 }
  ],
  "source_uri": "..."
}
```

### GET /kb-playbook?intent=...&scope=...
Retrieve workflow by intent.

**Priority:** user > site > global (returns highest scope match)

**Output:**
```json
{
  "found": true,
  "playbook": {
    "intent": "create event",
    "steps": [
      { "action": "navigate", "description": "Go to events page" },
      { "action": "fill_form", "description": "Fill event details" }
    ],
    "required_slots": { "title": "string", "starts_at": "datetime" },
    "ask_templates": ["What's the event title?", "When does it start?"]
  }
}
```

## Integration with rocker-chat

### Knowledge Retrieval Flow

Before calling AI model:
1. **Check for playbook** - Intent-based workflow
2. **Search KB** - Semantic search on user message
3. **Resolve terms** - Check term_dictionary for domain vocabulary
4. **Augment system prompt** - Add retrieved knowledge as context

```typescript
// In rocker-chat/index.ts (around line 830)
const lastUserMessage = messages[messages.length - 1]?.content || '';

// 1. Try playbook
const { data: playbookData } = await supabase.functions.invoke('kb-playbook', {
  body: { intent: lastUserMessage }
});

// 2. Search KB
const { data: kbData } = await supabase.functions.invoke('kb-search', {
  body: { q: lastUserMessage, limit: 3, semantic: true }
});

// 3. Resolve terms
const { data: terms } = await supabase
  .from('term_dictionary')
  .select('*')
  .or(`term.ilike.%word%,synonyms.cs.{word}`)
  .limit(1)
  .maybeSingle();

// 4. Augment prompt
systemPrompt += knowledgeContext;
```

## Content Format

### Markdown with YAML Front-Matter

```markdown
---
title: Profile Types
category: entities
subcategory: profiles
tags: [profiles, types, unified-model]
scope: global
version: 1
---
# Profile Types

Content goes here with markdown formatting...

- Bullet points
- More content

## Sections

Related: [link to playbook](/workflows/create-profile)
```

### Playbook Format

```markdown
---
title: Create Event Workflow
category: workflows
scope: site
---
# Create Event

intent: create event

Required information:
- Event title
- Start date/time
- Event type

Steps:
1. Navigate to events page (/events/create)
2. Fill event details form
3. Add optional description
4. Click submit
5. Confirm creation

Related: [event registration](/workflows/register-event)
```

## SDK Usage

```typescript
import { 
  searchKnowledge, 
  getKnowledgeItem, 
  getPlaybook,
  resolveTerm 
} from '@/lib/ai/rocker/kb';

// Search knowledge
const results = await searchKnowledge({
  q: 'create event',
  scope: 'site',
  category: 'workflows',
  limit: 5,
});

// Get playbook
const playbook = await getPlaybook('create event');

// Resolve term
const term = await resolveTerm('jackpot');
```

## Ingestion Workflow

### Manual (Admin)
1. Create markdown file with YAML front-matter
2. Call `/kb-ingest` with content
3. System parses, chunks, embeds, stores

### Automated (Future)
1. Upload to Supabase Storage bucket
2. Trigger on file upload
3. Auto-ingest via edge function

## Seeding Initial Knowledge

Use the provided seed files:
- `global://entities/profiles/types.md`
- `site://yalls.ai/marketplace/taxonomy.md`
- `site://yalls.ai/analytics/kpi/business.md`

Example ingestion:
```typescript
const content = await readFile('seeds/global-entities-profiles-types.md');
await supabase.functions.invoke('kb-ingest', {
  body: {
    content,
    uri: 'global://entities/profiles/types',
  }
});
```

## Vector Search Details

### Similarity Functions
- **Cosine distance**: `1 - (embedding <=> query_embedding)`
- **Thresholds**: 
  - Items: 0.6 (broader matches)
  - Chunks: 0.7 (precise matches)

### HNSW Index Parameters
- `m = 16`: Connections per node
- `ef_construction = 64`: Build-time accuracy

### Search Strategy
1. **Keyword** - Fast text search on titles/tags
2. **Semantic** - Vector similarity on embeddings
3. **Hybrid** - Merge with deduplication (prioritize matches in both)

## Testing

Run tests:
```bash
npm run test tests/unit/kb.test.ts
```

Coverage:
- Search (keyword, semantic, hybrid)
- Playbook retrieval
- Item fetching
- Term resolution
- Related items
- Ingestion

## Best Practices

### Content Guidelines
- ✅ Use descriptive titles
- ✅ Add comprehensive tags
- ✅ Include cross-references
- ✅ Keep chunks under 2000 chars
- ✅ Use clear section headings

### Performance
- ✅ Index frequently searched categories
- ✅ Cache playbooks in memory (TTL: 1h)
- ✅ Batch embedding generation
- ✅ Use HNSW for vector search (not IVFFlat)

### Security
- ✅ Scope-based RLS (global/site/user)
- ✅ Admin-only write access
- ✅ Validate YAML metadata
- ✅ Sanitize content before storage

## Future Enhancements

1. **Auto-categorization** - AI categorizes content
2. **Confidence scores** - Track KB item effectiveness
3. **Version control** - Track knowledge evolution
4. **Multi-language** - I18n support
5. **Rich media** - Images, diagrams in KB
6. **Federated KB** - Cross-tenant knowledge sharing

## Troubleshooting

### No search results
- Check RLS policies match user scope
- Verify embeddings generated (OPENAI_API_KEY set)
- Lower similarity threshold

### Slow searches
- Add indexes on frequently filtered columns
- Use HNSW index (not sequential scan)
- Limit chunk count per item

### Playbooks not triggering
- Check intent matching (case-insensitive, fuzzy)
- Verify scope precedence (user > site > global)
- Ensure playbook has valid steps

## Metrics

Track KB effectiveness:
- Search CTR (clicks / searches)
- Playbook completion rate
- Term resolution rate
- Knowledge coverage gaps

Query from admin dashboard:
```sql
SELECT 
  category,
  COUNT(*) as item_count,
  AVG(confidence_score) as avg_confidence
FROM knowledge_items
GROUP BY category;
```
