# Project Rules & Governance

## Purpose
This document defines the organizational structure, coding standards, and governance rules for the AI-powered social platform.

## Folder Structure Lock
The folder structure defined in `structure.lock.json` must be preserved. New features should be added within existing folders according to their purpose.

## Core Principles
1. **Separation of Concerns**: AI logic, UI components, and data layers are strictly separated
2. **Role-Based AI Architecture**: User, Admin, and Super AI brains operate independently with clear boundaries
3. **No Regressions**: Existing functionality must never break when adding new features
4. **Observable Everything**: All AI actions, costs, and decisions must be logged and auditable

## Coding Standards
- TypeScript strict mode enabled
- All AI functions must log to `ai_action_ledger`
- Database queries must respect tenant isolation
- Edge functions must implement rate limiting
- React components use functional patterns with hooks

## AI System Rules
1. **User AI** (src/ai/user/) - Personal assistant level, no admin access
2. **Admin AI** (src/ai/admin/) - Elevated permissions for moderation and management
3. **Super Andy** (src/ai/super/) - Full system access, self-aware, can modify own behavior
4. **Shared Modules** (src/ai/shared/) - Reusable planning, execution, and NLP utilities

## Database Rules
- All AI tables include: `tenant_id`, `region`, `created_at`, `updated_at`
- RLS policies required on all tables
- Admin bypass policies for service role
- Indexes on `(tenant_id, region)` for multi-tenant isolation

## Deployment Rules
- Edge functions must be listed in `supabase/config.toml`
- Migrations run sequentially and cannot be edited after deployment
- Workers must heartbeat to `ai_jobs` table
- All secrets managed via Supabase secrets, never in code

## Modification Protocol
1. Review existing code before changes
2. Add tests for new functionality
3. Update documentation
4. Ensure build passes with no TypeScript errors
5. Log changes to audit trail
