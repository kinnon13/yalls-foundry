# Feature Flags System (Production)

## Overview

Production-grade feature flag system with RLS, user overrides, and safe mode kill switch.

## Tables

### `feature_flags`
Global feature flags readable by all, writable only by super admins.

```sql
CREATE TABLE public.feature_flags (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### `feature_flag_overrides`
Per-user flag overrides for testing and gradual rollouts.

```sql
CREATE TABLE public.feature_flag_overrides (
  key        text NOT NULL,
  user_id    uuid NOT NULL,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, user_id)
);
```

## Bootstrap Flags

| Key | Default | Description |
|-----|---------|-------------|
| `global.safe_mode` | `{"enabled": false}` | Kill switch: disables exploration |
| `learning.enabled` | `{"enabled": true, "rollout": 1.0}` | Bandits + reward logging |
| `rocker.conversation` | `{"enabled": true, "min_probe_gap_sec": 90}` | Back-and-forth interview mode |
| `rocker.nudges` | `{"enabled": true, "mode": "adhd", "interval_min": 10}` | Focus nudges |
| `ranker.epsilon` | `{"value": 0.08, "mobile": 0.12, "desktop": 0.08}` | Exploration rates |
| `marketplace.suggestions` | `{"enabled": true, "rollout": 1.0}` | Marketplace UX |

## Usage

### Frontend (React)

```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function MyComponent() {
  const { isEnabled, getValue, loading } = useFeatureFlags();

  if (loading) return <div>Loading...</div>;

  if (isEnabled('rocker.conversation')) {
    return <RockerChat />;
  }

  const epsilon = getValue('ranker.epsilon', { value: 0.08 });
  // ...
}
```

### Backend (Edge Functions)

```typescript
import { isSafeMode, getFlag } from '@/lib/featureFlags';

const safeMode = await isSafeMode(supabase);
const epsilon = safeMode ? 0 : 0.08;
```

## Admin Controls

### Emergency Safe Mode

```sql
-- Turn on (disables all exploration)
UPDATE public.feature_flags 
SET value = '{"enabled": true}'::jsonb, updated_at = now() 
WHERE key = 'global.safe_mode';

-- Turn off
UPDATE public.feature_flags 
SET value = '{"enabled": false}'::jsonb, updated_at = now() 
WHERE key = 'global.safe_mode';
```

### Per-User Override

```sql
-- Give specific user custom epsilon
INSERT INTO public.feature_flag_overrides(key, user_id, value)
VALUES ('ranker.epsilon', '<USER_UUID>', '{"value": 0.15}')
ON CONFLICT (key, user_id) 
DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Remove override
DELETE FROM public.feature_flag_overrides 
WHERE key = 'ranker.epsilon' AND user_id = '<USER_UUID>';
```

## Verification

```sql
-- Check all flags
SELECT key, value, description FROM public.feature_flags ORDER BY key;

-- Check user overrides
SELECT * FROM public.feature_flag_overrides WHERE user_id = '<USER_UUID>';

-- Verify safe mode in learning events
SELECT p_exp, explored FROM public.learning_events 
ORDER BY ts DESC LIMIT 10;
```

## RLS Policies

- **feature_flags**: Everyone reads, only super admins write
- **feature_flag_overrides**: Users read own, only super admins write

## API Endpoint

`POST /functions/v1/feature-flags`

Returns merged flags (global + user overrides):

```json
{
  "flags": {
    "global.safe_mode": { "enabled": false },
    "learning.enabled": { "enabled": true, "rollout": 1.0 },
    "ranker.epsilon": { "value": 0.08, "mobile": 0.12 }
  }
}
```
