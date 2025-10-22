# `/supabase` - Backend Infrastructure

This directory contains all backend code and infrastructure for Y'alls Foundry.

## 📁 Structure

```
supabase/
├── config.toml           Supabase project configuration
│
├── functions/            Edge Functions (serverless backend)
│   ├── _shared/         Shared utilities
│   │   ├── ai.ts        AI gateway (OpenAI/Lovable)
│   │   ├── logger.ts    Structured logging
│   │   ├── rate-limit.ts Rate limiting
│   │   ├── tenantGuard.ts Tenant isolation
│   │   ├── cors.ts      CORS headers
│   │   ├── rbac.ts      Role-based access control
│   │   └── ...
│   │
│   ├── rocker-*/        Rocker AI functions (30+)
│   ├── andy-*/          Andy AI functions (15+)
│   ├── business-*/      Business operations
│   ├── calendar-*/      Calendar management
│   ├── crm-*/           CRM operations
│   ├── payments-*/      Payment processing
│   ├── health-*/        Health checks
│   └── ...              (169 active functions)
│
└── migrations/           Database migrations (managed by Supabase)
    └── *.sql            Migration files (READ-ONLY)
```

## 🎯 Edge Functions

### Structure
Each edge function follows this pattern:
```
functions/
└── my-function/
    └── index.ts         All logic in one file (no subdirs)
```

### Required Patterns

#### 1. CORS Headers
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle OPTIONS
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

#### 2. Rate Limiting
```typescript
import { withRateLimit } from '../_shared/rate-limit-wrapper.ts';

// Wrap your handler
export default withRateLimit(handler, {
  requests: 10,
  window: 60,
  identifier: (req) => req.headers.get('authorization')
});
```

#### 3. Structured Logging
```typescript
import { logger } from '../_shared/logger.ts';

logger.info('Operation started', { userId, action });
logger.error('Operation failed', { error: e.message });

// ❌ DO NOT USE console.log()
```

#### 4. Tenant Isolation
```typescript
import { guardTenant } from '../_shared/tenantGuard.ts';

const { tenantId } = await guardTenant(req, supabaseAdmin);
// Now all queries are tenant-scoped
```

### Forbidden Patterns

❌ **Raw SQL Execution**
```typescript
// NEVER DO THIS
supabase.rpc('execute_sql', { query: 'SELECT * FROM users' })
```

✅ **Use Supabase Client Methods**
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('tenant_id', tenantId);
```

❌ **Importing from /src**
```typescript
// NEVER DO THIS
import { helper } from '../../../src/lib/helper.ts';
```

✅ **Keep Code in Function or _shared/**
```typescript
// Put shared code in _shared/
import { helper } from '../_shared/helper.ts';
```

❌ **Missing Rate Limits**
```typescript
// Every function MUST use withRateLimit()
```

❌ **Console Logging**
```typescript
// Use structured logger instead
import { logger } from '../_shared/logger.ts';
```

## 🔧 Configuration

### `config.toml`
- Defines all edge functions
- Sets JWT verification per function
- Project-level settings

**Important**: Always keep `project_id` as the first line.

Example:
```toml
project_id = "xuxfuonzsfvrirdwzddt"

[functions.my-function]
verify_jwt = true  # Requires authentication

[functions.public-function]
verify_jwt = false  # Public endpoint
```

## 🗄️ Database Migrations

Migrations are managed by Supabase and stored in `/migrations`.

**READ-ONLY**: Do not manually edit migration files.

Use Lovable Cloud UI or Supabase CLI to create migrations.

## 🔐 Secrets Management

All secrets use Lovable Cloud secrets manager:

```typescript
// In edge functions
const apiKey = Deno.env.get('OPENAI_API_KEY');
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
```

**Never commit secrets to code.**

## 📊 Shared Utilities (`_shared/`)

| File | Purpose |
|------|---------|
| `ai.ts` | AI gateway (OpenAI/Lovable) |
| `logger.ts` | Structured logging |
| `rate-limit.ts` | Rate limiting implementation |
| `rate-limit-wrapper.ts` | Rate limit wrapper |
| `tenantGuard.ts` | Tenant isolation |
| `cors.ts` | CORS headers |
| `rbac.ts` | Role-based access control |
| `requireSuperAdmin.ts` | Super admin guard |
| `idempotency.ts` | Idempotency key handling |
| `cacheHeaders.ts` | Cache control headers |
| `sse.ts` | Server-sent events |
| `capabilities.ts` | Feature capabilities |

## 🧪 Testing Edge Functions

### Local Testing
```bash
# Using Supabase CLI
supabase functions serve my-function

# Call locally
curl http://localhost:54321/functions/v1/my-function \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Production Testing
Use Lovable Cloud UI to view function logs and debug.

## 📏 File Size Guidelines

- **Maximum**: 300 lines per function
- **Recommended**: <200 lines
- **Action**: Extract shared logic to `_shared/` if exceeding

## 🚀 Deployment

Edge functions are deployed automatically when you push code.

**No manual deployment needed.**

## 🔗 Related Docs

- [PROJECT_RULES.md](../PROJECT_RULES.md) - Project-wide rules
- [production/PRODUCTION_HARDENING.md](../docs/production/PRODUCTION_HARDENING.md) - Production best practices
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
