# 🏗️ Y'alls Foundry Project Rules

**Last Updated**: 2025-10-22  
**Status**: Active - Enforced by CI

---

## 📁 Directory Structure (Locked)

```
yalls-foundry/
├── src/              All frontend code, components, routes, hooks
├── supabase/         All backend code, edge functions, migrations
├── scripts/          All automation, utilities, health checks
├── docs/             All documentation, architecture, processes
├── tests/            All test suites (a11y, e2e, unit)
├── public/           Static assets only (images, fonts, etc.)
├── .github/          CI/CD workflows and GitHub config
└── archive/          Deprecated/experimental code (reference only)
```

**Rule #1**: Do not create new top-level directories without updating this file.

---

## 🔒 File Size Limits

- **Maximum file size**: 300 lines
- **Recommended**: <200 lines per file
- **Action on violation**: Split into focused components/modules

**Current violations to fix**:
- ✅ `src/App.tsx` (571 lines) - SPLIT INTO: App.tsx, AppProviders.tsx, AppKeyboardShortcuts.tsx
- ✅ `src/lib/ai/rocker/tools.ts` (801 lines) - SPLIT INTO: tools/{navigation,forms,business,calendar,ai}.ts
- ✅ `src/components/rocker/RockerChatUI.tsx` (490 lines) - SPLIT INTO: RockerChatUI.tsx, chat/{MessageList,ChatInput,VoiceControls,ConversationManager}.tsx
- ✅ `src/routes/dashboard.tsx` (585 lines) - SPLIT INTO: dashboard/{index,UserStats,MLMStats,AdminPanels,ProfileOverview}.tsx
- ✅ `src/routes/entities/unclaimed.tsx` (312 lines) - SPLIT INTO: unclaimed/{index,EntityCard,EntityGrid}.tsx

---

## 🚫 Forbidden Patterns

### 1. Hardcoded Values
- ❌ Tenant IDs: `'00000000-0000-0000-0000-000000000000'`
- ❌ API Keys: Directly in code
- ❌ URLs: Hardcoded endpoints
- ✅ Use: Environment variables, config files, database

### 2. Console Logging
- ❌ `console.log()`, `console.warn()` in edge functions
- ✅ Use: Structured logger from `_shared/logger.ts`

### 3. Missing Rate Limits
- ❌ Edge functions without `withRateLimit()`
- ✅ Use: `import { withRateLimit } from '../_shared/rate-limit-wrapper.ts'`

### 4. Raw SQL in Edge Functions
- ❌ `supabase.rpc('execute_sql', ...)`
- ✅ Use: Supabase client methods (`from()`, `insert()`, etc.)

### 5. Direct Imports from /src in Edge Functions
- ❌ `import { foo } from '../../../src/...'`
- ✅ Use: Inline code or shared utilities in `_shared/`

---

## 📦 Organization Standards

### Frontend (`/src`)
```
src/
├── routes/           Page-level components (one per route)
├── components/       Reusable UI components
│   ├── ui/          shadcn/ui components (do not edit directly)
│   └── [feature]/   Feature-specific components
├── lib/             Shared logic, utilities, SDKs
├── hooks/           Custom React hooks
├── contexts/        React contexts and providers
├── types/           TypeScript type definitions
├── feature-kernel/  Feature islands architecture
└── integrations/    External service integrations (auto-generated)
```

### Backend (`/supabase`)
```
supabase/
├── functions/
│   ├── _shared/     Shared utilities (logger, rate-limit, auth, etc.)
│   └── [function]/  Individual edge functions (index.ts only)
├── migrations/      Database migrations (read-only, Supabase-managed)
└── config.toml      Supabase configuration
```

### Scripts (`/scripts`)
```
scripts/
├── health/          Health checks and monitoring
├── audit/           Audit and reporting scripts
├── validation/      Architecture and structure validation
├── fixes/           Automated fix scripts
└── database/        Database utilities and SQL scripts
```

### Documentation (`/docs`)
```
docs/
├── architecture/    System design and architecture docs
├── processes/       Workflows and procedures
├── production/      Production hardening and deployment
└── audit/          Audit reports and findings
```

---

## 🔐 Security Requirements

### 1. Secrets Management
- All secrets MUST use Lovable Cloud secrets manager
- NEVER commit API keys, tokens, or credentials
- Use `Deno.env.get('SECRET_NAME')` in edge functions
- Use `import.meta.env.VITE_*` in frontend (public keys only)

### 2. Row Level Security (RLS)
- All public tables MUST have RLS enabled
- All policies MUST be tenant-isolated where applicable
- Test policies with different user roles

### 3. Input Validation
- Validate all user input
- Use Zod schemas for type safety
- Sanitize before database insertion

---

## 🧪 Testing Requirements

### Before Commit
- [ ] TypeScript build passes: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] No console.log in edge functions
- [ ] No hardcoded tenant IDs
- [ ] All edge functions have rate limiting

### Before Deploy
- [ ] Health scripts pass: `./scripts/health/generate-report.mjs`
- [ ] Accessibility tests pass: `npm run test:a11y`
- [ ] Edge functions deploy successfully
- [ ] Database migrations apply cleanly

---

## 📝 Commit Message Format

```
<type>: <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Test additions/changes
- `chore`: Build process, tooling, etc.
- `perf`: Performance improvements
- `security`: Security fixes

**Example**:
```
refactor: split large dashboard component

- Extract UserStats, MLMStats, AdminPanels components
- Reduce dashboard.tsx from 585 to 120 lines
- No functional changes

Impact: Improved maintainability, easier testing
```

---

## 🚀 Deployment Workflow

1. **Local Development**
   - Make changes in feature branch
   - Run tests locally
   - Commit with proper message

2. **CI Validation**
   - Automated tests run on push
   - Architecture validation
   - Security scans

3. **Staging Deploy**
   - Automatic deploy to staging on merge to `main`
   - Smoke tests in staging environment

4. **Production Deploy**
   - Manual approval required
   - Database migrations run first
   - Edge functions deploy last
   - Rollback plan ready

---

## 🛠️ Maintenance

### Weekly
- Review and archive old branches
- Check for dependency updates
- Review error logs

### Monthly
- Run full audit suite
- Review and update documentation
- Clean up archived code
- Review and optimize database queries

### Quarterly
- Architecture review
- Performance audit
- Security audit
- Dependency upgrades

---

## 🔄 Evolution Process

**To propose changes to this file**:
1. Open an issue describing the change
2. Get team consensus
3. Update this file
4. Update `structure.lock.json`
5. Update affected READMEs
6. Commit with message: `docs: update PROJECT_RULES - [reason]`

---

## 📞 Key Contacts

- **Architecture Questions**: See `docs/architecture/`
- **Deployment Issues**: See `docs/production/PRODUCTION_HARDENING.md`
- **Development Workflow**: See `docs/processes/SOLO_WORKFLOW.md`

---

**Remember**: These rules exist to keep the codebase clean, maintainable, and scalable. When in doubt, ask before breaking the rules.
