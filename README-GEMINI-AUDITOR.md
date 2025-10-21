# Gemini Second Auditor + Read-Only KB Ingestion

## Overview

This system implements a **Gemini-powered second auditor** that runs on every PR, along with **read-only knowledge base ingestion** for site pages and repository files. All AI calls are centralized through a unified gateway that supports multiple providers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified AI Gateway                        │
│  supabase/functions/_shared/ai.ts                           │
│  • Providers: lovable (default), openai, stub              │
│  • Capabilities: chat, streamChat, embed, moderate, tts    │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  Site Crawler   │  │  Repo Ingestion │  │  Gemini Audit  │
│  rocker-crawl-  │  │  rocker-ingest- │  │  rocker-audit  │
│  site           │  │  repo           │  │                │
└────────┬────────┘  └────────┬────────┘  └───────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   pgvector KB     │
                    │  • kb_sources     │
                    │  • kb_documents   │
                    │  • kb_chunks      │
                    └───────────────────┘
```

## Components

### 1. Unified AI Gateway
**File**: `supabase/functions/_shared/ai.ts`

- Provider-agnostic AI calls (lovable, openai, stub)
- Automatic provider selection via `AI_PROVIDER` env var
- Supports chat, streaming, embeddings, moderation, TTS
- Models:
  - lovable: `google/gemini-2.5-flash` for chat, `google/text-embed` for embeddings
  - openai: `gpt-4.1`, `gpt-4o-mini`, `text-embedding-3-large`

### 2. Knowledge Base Schema
**Migration**: `supabase/migrations/20250221000000_kb_schema.sql`

- `kb_sources`: Tracks ingested sources (site, repo, manual)
- `kb_documents`: Individual pages/files with deduplication via SHA256
- `kb_chunks`: Vectorized segments with embeddings (vector dimension 1536)
- RLS policies: Read for authenticated users, write for super_admin only
- IVFFlat index for fast cosine similarity search

### 3. Site Crawler
**Function**: `supabase/functions/rocker-crawl-site/index.ts`

- Crawls public website content
- Respects allow/deny lists (denies: `/admin`, `/auth`, `/live`, `/settings`)
- Cleans HTML → text, chunks, embeds, stores in KB
- Deduplicates via SHA256 hash
- **RBAC**: Requires `super_admin` role

**Usage**:
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/rocker-crawl-site" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{
    "baseUrl": "https://your-site.com",
    "maxPages": 50,
    "maxDepth": 3,
    "chunkChars": 800
  }'
```

### 4. Repo Ingestion
**Function**: `supabase/functions/rocker-ingest-repo/index.ts`

- Ingests source files from GitHub repositories
- Supports glob patterns for include/exclude
- Chunks code by language heuristics
- Deduplicates via SHA256
- **RBAC**: Requires `super_admin` role

**Usage**:
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/rocker-ingest-repo" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{
    "repo": "owner/repo",
    "ref": "main",
    "include_globs": ["**/*.ts", "**/*.tsx", "**/*.sql"],
    "exclude_globs": ["**/node_modules/**", "**/dist/**"]
  }'
```

### 5. KB Search
**Function**: `supabase/functions/kb-search/index.ts` (existing)

- Vector similarity search over KB chunks
- Supports filtering by source
- Returns top-K most relevant chunks
- **RBAC**: Requires authentication

### 6. Gemini Second Auditor
**Function**: `supabase/functions/rocker-audit/index.ts`

- Analyzes PR diffs for security issues
- Uses Gemini via unified AI gateway
- Identifies: secrets, XSS, CSRF, SQL injection, PII leaks, prompt injection, missing tests
- Returns structured JSON findings
- **RBAC**: Requires `super_admin` role

**System Prompt** (exact):
```
You are **Gemini**, serving as a *second auditor* for a TypeScript/React + Supabase project.
Read the provided unified diff and produce a JSON array of issues:
[{
  "severity": "critical|high|medium|low|nit",
  "title": "short summary",
  "file": "path/to/file",
  "line": 123,
  "advice": "actionable fix in plain language",
  "rationale": "why this matters",
  "code_suggestion": "optional patch snippet"
}]

Focus on: security, privacy, prompt injection, auth/RLS, code safety, error handling, testing, accessibility.
If no issues found, return []. Output **only** valid JSON.
```

### 7. GitHub CI Workflow
**File**: `.github/workflows/gemini-audit.yml`

- Triggers on PR open/sync/reopen
- Generates unified diff vs base branch
- Calls `rocker-audit` function
- Posts findings as PR comment
- Includes severity table and detailed findings

**Setup**:
1. Add secrets to GitHub repo:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Ensure super_admin user has service role key access
3. Workflow runs automatically on PRs

### 8. Capability Manifest
**File**: `supabase/functions/_shared/capabilities.ts`

- Read-only list of system capabilities
- Used by admin interfaces and auditor
- Categories: admin, query, security, ai
- Each capability specifies RBAC requirements

## Environment Variables

```env
# AI Provider
AI_PROVIDER=lovable  # lovable (default) | openai | stub
LOVABLE_API_KEY=auto_configured
OPENAI_API_KEY=sk-...  # Optional

# GitHub (for repo ingestion)
GITHUB_TOKEN=ghp_...  # Optional, increases rate limits

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Testing

### Test Audit System
```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...
./scripts/test-audit.sh
```

### Test KB System
```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...
./scripts/test-kb.sh
```

### Manual Test
```bash
# Add to package.json:
"scripts": {
  "test:audit": "bash scripts/test-audit.sh",
  "test:kb": "bash scripts/test-kb.sh"
}

pnpm test:audit
pnpm test:kb
```

## Security Model

### Read-Only Design
- AI model has **no write access** to repo or DB beyond our controlled functions
- All writes go through super_admin-gated edge functions
- RLS policies enforce read-only access for authenticated users
- Service role used only in CI via GitHub secrets

### RBAC Matrix

| Capability | Anonymous | Authenticated | Super Admin |
|------------|-----------|---------------|-------------|
| kb-search | ❌ | ✅ | ✅ |
| rocker-crawl-site | ❌ | ❌ | ✅ |
| rocker-ingest-repo | ❌ | ❌ | ✅ |
| rocker-audit | ❌ | ❌ | ✅ |

### Audit Trail
- All super_admin actions logged to `rocker_admin_audit` table
- Unauthorized attempts logged with IP and path
- Gemini audit results include metadata: model, timestamp, PR number

## Production Considerations

1. **Rate Limiting**: Add rate limits to edge functions (already in `_shared/rate-limit.ts`)
2. **Monitoring**: Set up alerts for audit failures or critical findings
3. **GitHub Secrets**: Rotate `SUPABASE_SERVICE_ROLE_KEY` regularly
4. **Crawl Budget**: Adjust `maxPages` and `maxDepth` based on site size
5. **Vector Index**: Rebuild IVFFlat index if KB grows beyond 100K chunks
6. **Cost**: Monitor Lovable AI usage or use OpenAI with budget limits

## Troubleshooting

### Audit Not Running
- Check GitHub Actions logs
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in repo secrets
- Ensure user making request has `super_admin` role

### KB Search Returns No Results
- Verify embeddings were generated (check `kb_chunks.embedding` not null)
- Check `AI_PROVIDER` is set correctly
- Ensure vector index is created: `\d kb_chunks` in psql

### Edge Function Deploy Errors
- Check `supabase/config.toml` has function entries
- Verify imports in edge functions use Deno-compatible URLs
- Check function logs: `supabase functions logs <function-name>`

## Future Enhancements

- [ ] Incremental crawling (only update changed pages)
- [ ] Multi-repo ingestion support
- [ ] Slack/Discord notifications for critical audit findings
- [ ] Auto-apply safe code suggestions from Gemini
- [ ] Vector search UI component for end users
- [ ] Semantic code search across entire codebase

## License

Same as main project.
