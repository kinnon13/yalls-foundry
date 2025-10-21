# AI Personas - Complete Separation & Permissions Guide

## Overview

This application uses three distinct AI personas, each with specific capabilities, permissions, and voice profiles. This document explains how they are separated and enforced at every layer.

## 1. Canonical Naming

### Display Names
- **User Rocker** - Standard user assistant
- **Admin Rocker** - Organization administrator assistant  
- **Super Andy** - Super administrator with global access

### Role Keys (Code/Database)
```typescript
type AIRole = 'user_rocker' | 'admin_rocker' | 'super_andy';
```

### Routes
- `/rocker` - User Rocker interface
- `/admin-rocker` - Admin Rocker interface
- `/super-andy` - Super Andy interface

### Voice Profiles
- `user_rocker` → onyx @ 1.35×
- `admin_rocker` → nova @ 1.20×
- `super_andy` → alloy @ 1.25×

## 2. Capability Matrix

| Capability | User Rocker | Admin Rocker | Super Andy |
|------------|-------------|--------------|------------|
| **Chat & Assist** | ✅ | ✅ | ✅ |
| **Read Knowledge Base** | ✅ (scoped to user) | ✅ (scoped to organization) | ✅ (global access) |
| **Write/Update Knowledge** | ⛔ | ✅ (org scope) | ✅ (global) |
| **Manage Users/Roles** | ⛔ | ✅ (limited - within org) | ✅ (full access) |
| **Update Marketplace Categories** | ⛔ | ✅ (ensure existing) | ✅ (create/merge) |
| **Business Onboarding** | ✅ (self only) | ✅ (assist others) | ✅ (override/admin) |
| **Memory Edits** | ✅ (own memories) | ✅ (within org) | ✅ (global) |
| **Database Admin Operations** | ⛔ | ⛔ | ✅ |
| **View Analytics** | ⛔ | ✅ (org only) | ✅ (global) |
| **Rate Limits (req/min)** | 60 | 120 | 240 |
| **Voice Profile** | onyx @ 1.35x | nova @ 1.20x | alloy @ 1.25x |

## 3. Enforcement Layers

### A. Frontend Guards

#### Route Protection
**File:** `src/routes/admin-rocker.tsx`
```typescript
// Admin Rocker requires authenticated user with admin role
const { session } = useSession();
if (!session) redirect('/');

// Check admin capability via database
const { data: capabilities } = await supabase
  .from('account_capabilities')
  .select('*')
  .eq('user_id', session.userId)
  .eq('feature_id', 'admin_access');
```

**File:** `src/routes/super-andy.tsx`
```typescript
// Super Andy requires super admin check
const { isSuperAdmin, isLoading } = useSuperAdminCheck();
if (!isLoading && !isSuperAdmin) {
  navigate('/');
  return null;
}
```

#### Component-Level Guards
Components check capabilities before rendering admin/super-only features:
- `<RockerModeSwitcher>` - Shows/hides mode based on capabilities
- `<AdminRockerPanel>` - Only renders for admin users
- `<SuperAndyAdmin>` - Only renders for super admins

#### Navigation Visibility
**File:** `src/components/layout/Navigation.tsx`
- User Rocker link: Always visible when authenticated
- Admin Rocker link: Shown only if `hasCapability('admin_access')`
- Super Andy link: Shown only if `isSuperAdmin()`

### B. Edge Functions / API Layer

#### Role Validation in Edge Functions

**File:** `supabase/functions/rocker-chat/index.ts`
```typescript
// Validates actor_role from request body
const { actor_role, thread_id, message } = await req.json();

// Verify user has permission for this role
const { data: { user } } = await supabaseAdmin.auth.getUser(jwt);

if (actor_role === 'admin_rocker' || actor_role === 'super_andy') {
  // Check admin capabilities table
  const { data: caps } = await supabaseAdmin
    .from('account_capabilities')
    .select('feature_id')
    .eq('user_id', user.id);
    
  const hasAdminAccess = caps?.some(c => c.feature_id === 'admin_access');
  const hasSuperAccess = caps?.some(c => c.feature_id === 'super_admin');
  
  if (actor_role === 'admin_rocker' && !hasAdminAccess) {
    return new Response('Forbidden', { status: 403 });
  }
  
  if (actor_role === 'super_andy' && !hasSuperAccess) {
    return new Response('Forbidden', { status: 403 });
  }
}
```

#### Knowledge Base Access Control

**File:** `supabase/functions/kb-search/index.ts`
```typescript
// Scope knowledge search based on actor_role
let query = supabaseAdmin
  .from('knowledge_chunks')
  .select('*');

switch (actor_role) {
  case 'user_rocker':
    // User-scoped: only their own knowledge
    query = query.eq('user_id', user.id);
    break;
    
  case 'admin_rocker':
    // Org-scoped: organization knowledge
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();
    query = query.eq('org_id', profile.org_id);
    break;
    
  case 'super_andy':
    // Global: no filter, access all knowledge
    break;
}
```

### C. Row Level Security (RLS) Policies

#### User Roles Table
**Table:** `user_roles`

```sql
-- View own roles
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only super admins can modify roles
CREATE POLICY "Super admins can manage roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);
```

#### Knowledge Chunks Table  
**Table:** `knowledge_chunks`

```sql
-- Users see their own + public + org knowledge
CREATE POLICY "User rocker knowledge access"
ON knowledge_chunks FOR SELECT
USING (
  user_id = auth.uid()
  OR is_public = true
  OR org_id IN (
    SELECT org_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- Admin rocker can write org knowledge
CREATE POLICY "Admin rocker write org knowledge"
ON knowledge_chunks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM account_capabilities
    WHERE user_id = auth.uid()
    AND feature_id = 'admin_access'
  )
  AND org_id IN (
    SELECT org_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- Super Andy has unrestricted access
CREATE POLICY "Super Andy full access"
ON knowledge_chunks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);
```

#### Rocker Threads & Messages
**Table:** `rocker_threads`, `rocker_messages`

```sql
-- Threads are visible based on actor_role
CREATE POLICY "User sees own threads"
ON rocker_threads FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- Messages inherit thread visibility
CREATE POLICY "Messages visible via thread access"
ON rocker_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rocker_threads
    WHERE id = rocker_messages.thread_id
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
      )
    )
  )
);
```

### D. Supabase Client Usage

#### Service Role vs Anon Key

**Anon Key** (`VITE_SUPABASE_PUBLISHABLE_KEY`):
- Used for client-side operations
- Subject to RLS policies
- User Rocker and Admin Rocker use this
- Permissions limited by authenticated user's role

**Service Role** (server-only):
- Bypasses RLS
- Used only in edge functions for Super Andy operations
- Never exposed to client
- Admin operations that need to override RLS

**Example:** Super Andy user management
```typescript
// Client-side: uses anon key, respects RLS
const { data } = await supabase.from('profiles').select('*');

// Edge function: uses service role for admin ops
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);
const { data } = await supabaseAdmin.from('profiles').select('*');
```

## 4. Data Separation

### Threads & Messages Storage

**Schema:**
```sql
rocker_threads (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  actor_role text CHECK (actor_role IN ('user_rocker', 'admin_rocker', 'super_andy')),
  created_at timestamptz
);

rocker_messages (
  id bigint PRIMARY KEY,
  thread_id uuid REFERENCES rocker_threads,
  role text CHECK (role IN ('user', 'assistant')),
  content text,
  meta jsonb, -- includes actor_role for auditing
  created_at timestamptz
);
```

**Actor Role Tracking:**
- Stored in `thread.actor_role` and `message.meta.actor_role`
- Used for:
  - Filtering conversations by persona
  - Analytics/reporting
  - Audit trails
  - Capability enforcement in queries

### Knowledge Partitions

**User-scoped:**
```sql
SELECT * FROM knowledge_chunks
WHERE user_id = auth.uid();
```

**Org-scoped (Admin Rocker):**
```sql
SELECT kc.*
FROM knowledge_chunks kc
JOIN profiles p ON kc.org_id = p.org_id
WHERE p.id = auth.uid();
```

**Global (Super Andy):**
```sql
SELECT * FROM knowledge_chunks;
-- No filter, access all
```

### Logging & Analytics

**Event Fields:**
```typescript
{
  event_type: 'chat_message' | 'voice_tts_start' | 'knowledge_access',
  actor_role: 'user_rocker' | 'admin_rocker' | 'super_andy',
  user_id: uuid,
  thread_id: uuid,
  timestamp: timestamptz,
  metadata: jsonb
}
```

**Standardized Event Names:**
- `voice.tts_start.{actor_role}`
- `voice.tts_error.{actor_role}`
- `chat.message.{actor_role}`
- `knowledge.search.{actor_role}`
- `admin.user_management.{actor_role}`

## 5. Voice Separation

### Voice Configuration

**File:** `src/config/voiceProfiles.ts`
```typescript
export type VoiceRole = 'user_rocker' | 'admin_rocker' | 'super_andy';

export const VOICE_PROFILES: Record<VoiceRole, VoiceProfile> = {
  user_rocker: {
    engine: 'server_tts',
    voice: 'onyx',
    rate: 1.35,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
  },
  admin_rocker: {
    engine: 'server_tts',
    voice: 'nova',
    rate: 1.20,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
  },
  super_andy: {
    engine: 'server_tts',
    voice: 'alloy',
    rate: 1.25,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
  },
};
```

### Voice Hook Usage

**User Rocker:**
```typescript
const { speakAndThen, listen } = useVoice({
  role: 'user_rocker',
  enabled: voiceEnabled,
});
```

**Admin Rocker:**
```typescript
const { speakAndThen, listen } = useVoice({
  role: 'admin_rocker',
  enabled: voiceEnabled,
});
```

**Super Andy:**
```typescript
const { speakAndThen, listen } = useVoice({
  role: 'super_andy',
  enabled: voiceEnabled,
});
```

### Server-Side Voice Parameters

**File:** `supabase/functions/text-to-speech/index.ts`
```typescript
// Accepts role-specific voice parameters
const { text, voice, rate, pitch } = await req.json();

// Synthesizes with OpenAI TTS
const response = await fetch('https://api.openai.com/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'tts-1',
    input: text,
    voice: voice, // onyx|nova|alloy
    speed: rate,  // 1.35|1.20|1.25
    response_format: 'mp3',
  }),
});
```

### No Web Speech Fallback

All personas use **server-side TTS only**. If TTS fails:

1. Error logged to console with role context
2. Visual banner shown to user: "Voice unavailable for {Persona Name} ({voice}) — continuing in text mode"
3. Chat continues without audio
4. No browser-based Web Speech fallback

**Error Handling:**
```typescript
try {
  await speakAndThen(text, onEnd);
} catch (error) {
  console.error(`[Voice] TTS failed for ${role}:`, error);
  setTtsError(`Voice unavailable for ${getPersonaName(role)} (${profile.voice})`);
  // Continue without audio
  onEnd?.();
}
```

## 6. Security Considerations

### Attack Vectors & Mitigations

**1. Role Elevation (User → Admin/Super)**
- ❌ Frontend checks alone
- ✅ RLS policies enforce at database level
- ✅ Edge functions validate JWT claims + capabilities table
- ✅ Super admin role stored in separate `user_roles` table

**2. Cross-Organization Data Access**
- ✅ RLS policies filter by `org_id` for admin queries
- ✅ Edge functions join on `profiles.org_id` before allowing admin ops
- ✅ Super Andy explicitly requires `role = 'super_admin'`

**3. Knowledge Base Leaks**
- ✅ Knowledge chunks have `user_id` and `org_id` columns
- ✅ RLS policies enforce scoping per actor_role
- ✅ Edge functions apply filters before returning results

**4. Audit Trail Tampering**
- ✅ `rocker_messages.meta.actor_role` is immutable after insert
- ✅ Server-side logs include JWT claims + actor_role
- ✅ Only Super Andy can view cross-user audit trails

## 7. Testing Checklist

### Per-Persona Tests

**User Rocker:**
- [ ] Can access own threads/messages
- [ ] Cannot see other users' data
- [ ] Cannot access admin routes
- [ ] Voice logs show `role: user_rocker, voice: onyx, rate: 1.35`
- [ ] Knowledge search returns user-scoped results only

**Admin Rocker:**
- [ ] Can access org-scoped data
- [ ] Cannot access other orgs' data
- [ ] Can access `/admin-rocker` route
- [ ] Cannot access `/super-andy` route
- [ ] Voice logs show `role: admin_rocker, voice: nova, rate: 1.20`
- [ ] Can create org knowledge chunks

**Super Andy:**
- [ ] Can access all data across all orgs
- [ ] Can access `/super-andy` route
- [ ] Can manage user roles
- [ ] Voice logs show `role: super_andy, voice: alloy, rate: 1.25`
- [ ] Can view global analytics

### Cross-Persona Tests
- [ ] Switching between personas in UI updates voice profile
- [ ] DB queries respect actor_role scoping
- [ ] Edge functions reject unauthorized role requests
- [ ] Audit logs correctly track actor_role for each action

## 8. Migration Guide

### Updating Existing Data

If migrating from old role values (`user`, `admin`, `super`) to canonical names:

```sql
-- Add new enum values if using enum type
ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'user_rocker';
ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'admin_rocker';
ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'super_andy';

-- Migrate existing threads
UPDATE rocker_threads
SET actor_role = CASE
  WHEN actor_role = 'user' THEN 'user_rocker'
  WHEN actor_role = 'admin' THEN 'admin_rocker'
  WHEN actor_role IN ('super', 'super_rocker', 'knower') THEN 'super_andy'
  ELSE actor_role
END;

-- Migrate message metadata
UPDATE rocker_messages
SET meta = jsonb_set(
  COALESCE(meta, '{}'::jsonb),
  '{actor_role}',
  to_jsonb(
    CASE meta->>'actor_role'
      WHEN 'user' THEN 'user_rocker'
      WHEN 'admin' THEN 'admin_rocker'
      WHEN 'super' THEN 'super_andy'
      WHEN 'knower' THEN 'super_andy'
      ELSE COALESCE(meta->>'actor_role', 'user_rocker')
    END
  )
)
WHERE meta ? 'actor_role';
```

### Updating Application Code

1. **Voice Profiles:** Update all `useVoice({ role: 'X' })` calls to use canonical keys
2. **Route Definitions:** Update route paths and redirect old paths
3. **UI Text:** Search for "Super Rocker" and replace with "Super Andy"
4. **Analytics:** Update event names to use canonical role keys
5. **Edge Functions:** Update actor_role validation logic

---

## Changelog

**v1.0.0** (2025-01-XX)
- Initial documentation
- Defined three personas with canonical naming
- Established capability matrix and enforcement layers
- Documented voice separation and no-fallback policy
