# Site Structure - Three Surfaces

## ✅ Complete Implementation

All three surfaces are now fully wired with role-based navigation and organized page structure.

## Surfaces Overview

### 1. Super Andy (`/super-andy`)
**Access:** All users  
**Purpose:** Proactive AI assistant

**Features:**
- Chat interface with thread management
- Proactive suggestions rail
- Self-improvement log
- Execute Now functionality

**Files:**
- `/src/pages/SuperAndy/Index.tsx` - Main page with chat + rails
- `/src/pages/SuperAndy/ProactiveRail.tsx` - Suggestions component
- `/src/pages/SuperAndy/SelfImproveLog.tsx` - Self-improve component
- `/src/components/super-andy/SuperAndyChat.tsx` - Chat component

### 2. Admin Rocker (`/admin-rocker`)
**Access:** Admin & Super roles  
**Purpose:** Admin workspace

**Pages:**
- `/admin-rocker` - Overview dashboard
- `/admin-rocker/tools` - AI tools registry
- `/admin-rocker/audits` - Action ledger & audit trails
- `/admin-rocker/moderation` - Incidents & content review
- `/admin-rocker/budgets` - Model routes & budget monitoring

**Features:**
- Role-scoped tools viewing
- Action ledger with real-time updates
- Incident management with resolve actions
- Model router testing
- Budget usage tracking

**Files:**
- `/src/pages/AdminRocker/Index.tsx`
- `/src/pages/AdminRocker/Tools.tsx`
- `/src/pages/AdminRocker/Audits.tsx`
- `/src/pages/AdminRocker/Moderation.tsx`
- `/src/pages/AdminRocker/Budgets.tsx`

### 3. User Rocker (`/rocker`)
**Access:** All authenticated users  
**Purpose:** Personal productivity hub

**Pages:**
- `/rocker` - Personal dashboard
- `/rocker/preferences` - AI personalization settings

**Features:**
- Quick links to Super Andy
- Customizable AI preferences:
  - Tone (e.g., "friendly concise")
  - Verbosity (terse, medium, verbose)
  - Format (bullets, paragraphs, tables)
  - Approval mode (ask, auto, never)
  - Suggestion frequency (off, daily, weekly)

**Files:**
- `/src/pages/UserRocker/Index.tsx`
- `/src/pages/UserRocker/Preferences.tsx`

### 4. Super Console (`/super`)
**Access:** Super admin only  
**Purpose:** System monitoring & control

**Pages:**
- `/super` - System overview (health, queues, workers)
- `/super/pools` - Worker pool management
- `/super/workers` - Worker heartbeats & probing
- `/super/flags` - Control flags (global_pause, etc.)
- `/super/incidents` - Incident resolution

**Files:**
- `/src/pages/Super/index.tsx`
- `/src/pages/Super/Pools.tsx`
- `/src/pages/Super/Workers.tsx`
- `/src/pages/Super/Flags.tsx`
- `/src/pages/Super/Incidents.tsx`

## Navigation System

### Layout
- **AppLayout** (`/src/layouts/AppLayout.tsx`)
  - Sidebar with role-aware navigation
  - Main content area

### Role Gating
- **RoleGate** (`/src/components/navigation/RoleGate.tsx`)
  - Checks `super_admins` table for super role
  - Defaults to `user` role
  - Can be enhanced with `user_roles` table for admin

### Navigation
- **Nav** (`/src/components/navigation/Nav.tsx`)
  - Dynamic navigation based on user role
  - Shows/hides sections appropriately
  - Active route highlighting

## Quick Test Routes

```bash
# User surfaces (all users)
/super-andy          # Super Andy chat + rails
/rocker              # User Rocker hub
/rocker/preferences  # AI preferences

# Admin surfaces (admins & super)
/admin-rocker            # Admin overview
/admin-rocker/tools      # Tools registry
/admin-rocker/audits     # Action ledger
/admin-rocker/moderation # Incidents
/admin-rocker/budgets    # Model routing

# Super surfaces (super only)
/super           # System overview
/super/pools     # Worker pools
/super/workers   # Worker heartbeats
/super/flags     # Control flags
/super/incidents # Incident management
```

## Role Hierarchy

1. **user** - Default authenticated users
   - Access: Super Andy, User Rocker
   
2. **admin** - Administrators
   - Access: Everything users have + Admin Rocker
   
3. **super** - Super administrators
   - Access: Everything + Super Console
   - Determined by `super_admins` table

## Database Tables Used

- `ai_proactive_suggestions` - Proactive suggestions
- `ai_self_improve_log` - Self-improvement changes
- `ai_tools` - Tools registry
- `ai_action_ledger` - Action audit trail
- `ai_incidents` - Incidents & escalations
- `ai_model_routes` - Model routing config
- `ai_model_budget` - Budget tracking
- `ai_user_profiles` - User preferences
- `super_admins` - Super admin access

## Testing the Site

1. **Start the dev server:**
   ```bash
   pnpm dev
   ```

2. **Seed demo data** (see `docs/testing/QUICK_START.md`)

3. **Test each surface:**
   - Navigate to each page
   - Verify data loads
   - Test actions (Execute Now, Resolve, Save Preferences, etc.)

4. **Test role gating:**
   - Try accessing `/super` without super admin role
   - Verify navigation shows/hides appropriately

## Next Steps

1. Run the Playwright tests: `pnpm exec playwright test tests/e2e/super.e2e.spec.ts`
2. Seed demo data using SQL from `docs/testing/QUICK_START.md`
3. Test each surface manually
4. Verify role gating works correctly
5. Test all action buttons (Execute Now, Resolve, Save, etc.)

## Architecture Notes

- All pages use shadcn/ui components
- Role checking is async (checks database)
- Navigation is dynamically generated based on role
- All data queries use React Query for caching
- Toasts provide user feedback for all actions
