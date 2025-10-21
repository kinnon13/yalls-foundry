# Feature Flag: Dynamic Persona Customization

## Overview

The `dynamic_personas_enabled` feature flag controls whether voice profiles and persona names can be customized dynamically per organization and user, or remain locked to static defaults.

**Default State:** `OFF` (false)  
**Access Control:** Only Super Andy (super_admin role) can toggle

## Static Profiles (Flag OFF - Default)

When the flag is **OFF** (default), all users receive the same locked voice profiles:

| Persona | Voice ID | Rate | Pitch | Display Name |
|---------|----------|------|-------|--------------|
| `user_rocker` | onyx | 1.35× | 1.02 | User Rocker |
| `admin_rocker` | nova | 1.20× | 1.02 | Admin Rocker |
| `super_andy` | alloy | 1.25× | 1.02 | Super Andy |

**Source:** `src/config/voiceProfiles.ts` → `STATIC_VOICE_PROFILES`

**Behavior:**
- No database lookups for voice profiles
- Instant loading (static config)
- No org/user overrides possible
- Consistent voice identity across all instances

## Dynamic Mode (Flag ON)

When the flag is **ON**, the system can load per-org and per-user voice profile overrides from the database.

**Planned Features (Not Yet Implemented):**
- Voice ID customization (e.g., change admin to 'echo')
- Rate/pitch adjustments per role
- Display name overrides (e.g., rename "User Rocker" to "Rocker")
- Organization-level defaults
- User-level preferences
- Realtime updates when profiles change

**Current Behavior:**
- Flag toggles successfully in UI
- `useVoice` hook checks the flag
- Still returns static profiles (dynamic merge not implemented)
- Infrastructure ready for future customization

## Database Schema

```sql
-- Feature flags table (already exists)
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB,
  category TEXT,
  enabled_for_tenants TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Anyone can read, super admins can update
```

## RPCs

### `get_feature_flag(flag_key TEXT) → BOOLEAN`

**Security:** `SECURITY DEFINER` (anyone can call)  
**Returns:** `true` if enabled, `false` if disabled or not found

```typescript
const { data: isDynamicEnabled } = await supabase
  .rpc('get_feature_flag', { flag_key: 'dynamic_personas_enabled' });
```

### `set_feature_flag(flag_key TEXT, flag_enabled BOOLEAN) → BOOLEAN`

**Security:** `SECURITY DEFINER` (super admin only)  
**Returns:** New state  
**Throws:** Exception if caller is not super admin

```typescript
const { error } = await supabase
  .rpc('set_feature_flag', { 
    flag_key: 'dynamic_personas_enabled', 
    flag_enabled: true 
  });
```

## Code Paths

### Hook: `useVoice({ role, enabled })`

**File:** `src/hooks/useVoice.ts`

**Logic:**
1. On mount, calls `get_feature_flag('dynamic_personas_enabled')`
2. If `false` (default): returns `STATIC_VOICE_PROFILES[role]`
3. If `true`: calls `getEffectiveVoiceProfile(role, isDynamicEnabled)`
4. Caches profile in state for the session

**Result:**
- Flag OFF → instant static profile
- Flag ON → async load (currently still returns static, ready for DB merge)

### Utility: `getEffectiveVoiceProfile(role, isDynamicEnabled, orgId?, userId?)`

**File:** `src/config/voiceProfiles.ts`

**Current Implementation:**
```typescript
export async function getEffectiveVoiceProfile(
  role: VoiceRole,
  isDynamicEnabled: boolean = false,
  _orgId?: string,
  _userId?: string
): Promise<VoiceProfile> {
  const base = STATIC_VOICE_PROFILES[role];
  
  if (!isDynamicEnabled) return base;
  
  // TODO: When flag is ON, merge DB overrides here
  // const dynamicOverrides = await fetchPersonaOverrides(role, orgId, userId);
  // return { ...base, ...dynamicOverrides };
  
  return base;
}
```

**Future Merge Strategy:**
1. Start with static base profile
2. Load global persona config (if exists)
3. Merge org-level overrides (if exists)
4. Merge user-level overrides (if exists)
5. Return effective profile

## UI: Persona Settings (Super Andy Only)

**Component:** `src/components/super-andy/PersonaSettings.tsx`  
**Location:** Super Andy → Admin → Settings tab

**Features:**
- Toggle switch for `dynamic_personas_enabled`
- Displays current static profiles (onyx/nova/alloy)
- Shows "Locked" or "Customizable" badge per profile
- Info message explaining current mode
- Only accessible by super admins

**User Flow:**
1. Super Andy opens Admin → Settings
2. Sees "Dynamic Persona System" toggle (OFF by default)
3. Toggles ON → success toast + refresh prompt
4. All future voice loads will check for overrides
5. Toggles OFF → reverts to locked defaults immediately

## Acceptance Tests

### ✅ Flag OFF (Default)

```bash
# Query the flag
curl -X POST https://<project>.supabase.co/rest/v1/rpc/get_feature_flag \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"flag_key": "dynamic_personas_enabled"}'
# Returns: false
```

- [ ] Business onboarding uses `onyx @ 1.35×`
- [ ] Admin chat uses `nova @ 1.20×`
- [ ] Super Andy uses `alloy @ 1.25×`
- [ ] Console logs show `{ role, voice, rate, dynamic: false }`
- [ ] No DB queries for voice profiles

### ✅ Flag ON (Super Admin Toggle)

```typescript
// Super Andy toggles flag ON
const { data } = await supabase
  .rpc('set_feature_flag', { 
    flag_key: 'dynamic_personas_enabled', 
    flag_enabled: true 
  });
// Returns: true
```

- [ ] Settings UI shows "Customizable" badges
- [ ] Console logs show `{ ..., dynamic: true }`
- [ ] Still uses static profiles (merge not implemented yet)
- [ ] Ready to accept DB overrides when implemented

### ✅ Security

- [ ] Non-admin users cannot call `set_feature_flag` (throws exception)
- [ ] Everyone can read flag state via `get_feature_flag`
- [ ] RLS policies enforce super_admin requirement

## Rollout Plan

### Phase 1: Locked Voices (Current)
- ✅ Feature flag created (default OFF)
- ✅ Static profiles enforced
- ✅ Super Andy toggle UI
- ✅ Hook checks flag but returns static

### Phase 2: Database Overrides (Future)
- [ ] Create `persona_configs` table (global/org/user)
- [ ] Implement `getEffectiveVoiceProfile` merge logic
- [ ] Add UI for editing voice profiles
- [ ] Realtime sync for profile changes

### Phase 3: Advanced Features (Future)
- [ ] Voice preview/testing
- [ ] Role-based access to customization
- [ ] Audit log for profile changes
- [ ] Bulk org profile management

## Migration & Cleanup

**No migration needed** - static profiles remain the default. Enabling the flag is non-destructive and reversible.

**To revert:**
```sql
UPDATE public.feature_flags
SET enabled = false, updated_at = now()
WHERE feature_key = 'dynamic_personas_enabled';
```

## Support & Troubleshooting

**Flag not toggling:**
- Verify caller has `super_admin` role in `user_roles` table
- Check RLS policies on `feature_flags` table

**Voice not changing after toggle:**
- Refresh the page (profile is cached on load)
- Check console for `[Voice] Profile loaded: { ..., dynamic: true/false }`

**Want different static defaults:**
- Edit `STATIC_VOICE_PROFILES` in `src/config/voiceProfiles.ts`
- Redeploy (no DB change needed)

## Related Files

- `src/config/voiceProfiles.ts` - Profile definitions & merge logic
- `src/hooks/useVoice.ts` - Flag check & profile loading
- `src/components/super-andy/PersonaSettings.tsx` - Toggle UI
- `supabase/migrations/...` - Feature flag table & RPCs
- `docs/ai-personas.md` - Full persona separation docs
