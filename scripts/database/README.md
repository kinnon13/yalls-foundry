# Database Scripts

**Last Updated:** 2025-10-22

## Purpose

Scripts for database operations including migrations, seeding, testing, and migration train management.

## Scripts

### apply-migrations.sh
Applies all SQL migrations from `supabase/migrations/` to a target database.

**Usage:**
```bash
# Using environment variable
DATABASE_URL="postgres://..." ./scripts/database/apply-migrations.sh

# Using argument
./scripts/database/apply-migrations.sh "postgres://..."
```

**Safety:**
- Runs migrations in order
- Stops on first error
- Transactional when possible

### seed-phase1.ts
Seeds initial demo entities for testing and development.

**Usage:**
```bash
# Deno runtime
deno run -A scripts/database/seed-phase1.ts

# Requires environment variables:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

**Seeds:**
- Business: Wild River Stables
- Horse: Starfire
- Person: Casey Morales
- Event: Spring Classic Show 2025

### demo-enqueue.ts
Demonstration script for enqueuing background jobs.

**Usage:**
```bash
DEMO_USER_ID="[UUID]" tsx scripts/database/demo-enqueue.ts
```

### create-train.sh
Creates daily migration train branches for batching database changes.

**Usage:**
```bash
./scripts/database/create-train.sh
```

**Migration Train Workflow:**
1. Create train branch: `train/db-YYYYMMDD`
2. All DB PRs merge to train
3. CI runs smoke tests on train
4. Merge train to staging if green
5. Delete train branch

## Database Change Process

1. **Never edit migrations directly** - they're immutable once deployed
2. **Create new migration** for changes:
   ```bash
   supabase migration new [description]
   ```
3. **Test locally first**:
   ```bash
   supabase db reset
   ```
4. **Use migration trains** for coordinating multiple DB changes
5. **Verify RLS policies** after schema changes

## Migration Standards

- Migrations must be idempotent when possible
- Include both up and down operations
- Add comments explaining complex logic
- Test with realistic data volumes
- Consider performance impact on production

## Rollback Strategy

If a migration fails in production:
1. Identify the problematic migration
2. Create a rollback migration
3. Apply via migration train
4. Verify data integrity
5. Update migration documentation
