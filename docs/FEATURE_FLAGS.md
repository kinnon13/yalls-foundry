# Feature Flags Guide

**Version:** 1.0.0  
**Owner:** DevOps Team  
**Last Updated:** 2025-01-17

## Overview

Feature flags allow us to ship code to production while keeping features hidden until ready. This enables:
- **Gradual rollouts** (5% → 100%)
- **A/B testing**
- **Emergency kill switches**
- **Dark launches** (internal testing)

## Adapter Mode Switch

### Environment Variable

Control mock vs DB adapters globally:

```bash
# Development (mock data in localStorage)
VITE_PORTS_MODE=mock

# Production (live Supabase)
VITE_PORTS_MODE=db
```

**Location:** `src/lib/env.ts`

```typescript
export const env = {
  PORTS_MODE: (import.meta.env?.VITE_PORTS_MODE ?? 'mock') as 'mock' | 'db',
  // ... other env vars
};
```

### How It Works

All data adapters automatically switch based on `PORTS_MODE`:

```typescript
// src/ports/index.ts
import { buildAdapters } from './buildAdapters';
import { env } from '@/lib/env';

const adapters = buildAdapters(env.PORTS_MODE);

export const ProfilePins = adapters.profilePins;
export const Favorites = adapters.favorites;
// ... etc
```

**Result:** One environment variable flips **all features** between mock and database.

## Per-Feature Flags

### Configuration

**Location:** `src/lib/feature-flags.ts`

```typescript
export const FLAGS = {
  profile_pins: {
    rollout: 1.0,        // 0.0 = off, 1.0 = 100%
    kill_switch: false,  // Emergency disable
  },
  favorites: {
    rollout: 1.0,
    kill_switch: false,
  },
  reposts: {
    rollout: 0.5,        // 50% of users
    kill_switch: false,
  },
  linked_accounts: {
    rollout: 0.1,        // 10% rollout
    kill_switch: false,
  },
  entity_edges: {
    rollout: 0.05,       // 5% canary
    kill_switch: false,
  },
  nba_modal: {
    rollout: 0.0,        // Disabled
    kill_switch: false,
  },
};

export type FeatureFlag = keyof typeof FLAGS;
```

### Usage in Code

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

export function ProfilePage() {
  const pinsEnabled = useFeatureFlag('profile_pins');
  
  return (
    <div>
      {pinsEnabled && <PinBoard />}
    </div>
  );
}
```

### User Bucketing

Rollout percentage uses deterministic hashing:

```typescript
// src/lib/feature-flags.ts
function isUserInRollout(userId: string, percentage: number): boolean {
  if (percentage >= 1.0) return true;
  if (percentage <= 0.0) return false;
  
  // Hash user ID to 0-1 range
  const hash = simpleHash(userId);
  return hash < percentage;
}
```

**Result:** Same user always gets same variant (no flicker).

## Rollout Strategy

### Phase 1: Internal (Week 1)

```typescript
profile_pins: { rollout: 0.0, kill_switch: false }
```

- Test with internal team
- Set `VITE_FORCE_FEATURE=profile_pins` in dev

### Phase 2: Canary (Week 2)

```typescript
profile_pins: { rollout: 0.05, kill_switch: false }
```

- 5% of production users
- Monitor error rates, latency
- Gather initial feedback

### Phase 3: Ramp (Week 3)

```typescript
// Day 1
profile_pins: { rollout: 0.10, kill_switch: false }

// Day 3
profile_pins: { rollout: 0.25, kill_switch: false }

// Day 5
profile_pins: { rollout: 0.50, kill_switch: false }
```

- Double every 2-3 days if metrics healthy
- Watch Sentry for errors
- Monitor p95 latency

### Phase 4: Full Launch (Week 4)

```typescript
profile_pins: { rollout: 1.0, kill_switch: false }
```

- 100% rollout
- Remove flag guards from code (optional)
- Keep kill switch for emergencies

## Kill Switch

### Emergency Disable

If feature causes production issues:

```typescript
// Instant disable for all users
profile_pins: { rollout: 0.0, kill_switch: true }
```

**Effect:** Feature hidden within 60 seconds (CDN cache).

### Gradual Disable

If issue affects subset of users:

```typescript
// Reduce from 100% → 50%
profile_pins: { rollout: 0.5, kill_switch: false }

// Further reduce to 10%
profile_pins: { rollout: 0.1, kill_switch: false }

// Disable completely
profile_pins: { rollout: 0.0, kill_switch: true }
```

## A/B Testing

### Variant Split

```typescript
export const EXPERIMENTS = {
  pin_limit: {
    control: { maxPins: 5 },
    variant: { maxPins: 8 },
    split: 0.5, // 50/50
  },
};

// Usage
const variant = useExperiment('pin_limit');
const maxPins = variant === 'control' ? 5 : 8;
```

### Track Metrics

```typescript
// Log exposure
logExperiment('pin_limit', variant, userId);

// Track outcome
trackMetric('pins_added', count, { variant });
```

## Local Development

### Override Flags

```bash
# .env.local
VITE_PORTS_MODE=mock
VITE_FORCE_FEATURE=profile_pins,favorites
```

**Result:** Specified features always enabled locally.

### Test Both States

```typescript
// Force enable
localStorage.setItem('feature_profile_pins', 'true');

// Force disable
localStorage.setItem('feature_profile_pins', 'false');

// Reload page
```

## Monitoring

### Key Metrics

Track for each feature flag:
- **Adoption rate:** % users with flag enabled
- **Error rate:** Errors per 1000 requests
- **Latency:** p50, p95, p99
- **Engagement:** Usage metrics (clicks, time spent)

### Alerts

Set up Datadog/Sentry alerts:
- Error rate > 1% → Page engineering
- Latency p95 > 500ms → Investigate
- Crash rate > 0.1% → Kill switch

## Best Practices

### DO

✅ Start with 5% rollout for new features  
✅ Monitor metrics before ramping  
✅ Keep kill switch ready  
✅ Use deterministic bucketing (same user = same variant)  
✅ Remove flag code after 100% stable for 2+ weeks  

### DON'T

❌ Deploy to 100% on first try  
❌ Ignore error rate spikes  
❌ Use random assignment (causes flicker)  
❌ Forget to remove old flag code  
❌ Have 10+ concurrent experiments  

## CLI Commands

```bash
# Check current flags
npm run flags:status

# Enable feature
npm run flags:enable profile_pins

# Disable feature
npm run flags:disable profile_pins

# Set rollout percentage
npm run flags:set profile_pins 0.25
```

## Migration Path

### Remove Flag (After 100% stable)

1. Verify metrics stable for 2+ weeks
2. Remove flag checks from code
3. Delete flag from `feature-flags.ts`
4. Update docs

```diff
- const pinsEnabled = useFeatureFlag('profile_pins');
- {pinsEnabled && <PinBoard />}
+ <PinBoard />
```

## Troubleshooting

### User Not in Rollout

```typescript
// Check user bucket
const hash = simpleHash(userId);
console.log(`User ${userId} hash: ${hash}`);
console.log(`Rollout threshold: ${FLAGS.profile_pins.rollout}`);
console.log(`Enabled: ${hash < FLAGS.profile_pins.rollout}`);
```

### Flag Not Taking Effect

1. Check CDN cache (60s TTL)
2. Verify env var set correctly
3. Clear localStorage
4. Hard refresh browser

## Related Docs

- [Rollback Runbook](./runbooks/rollback.md)
- [Incident Response](./runbooks/incident-response.md)
- [A/B Testing Guide](./AB_TESTING.md)

## Support

**Questions?** `#feature-flags` on Slack  
**Issues?** Tag `devops` in Jira  
**Owner:** @devops-lead
