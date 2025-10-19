# Auto-Pin on Follow - Implementation Complete

## ✅ Completed Features

### 1. Database Schema
- Added 4 columns to `user_pins` table:
  - `origin`: 'manual' | 'auto_follow'
  - `locked_until`: timestamptz (when pin unlocks)
  - `lock_reason`: text (e.g., 'auto_follow_business')
  - `use_count`: integer (tracks interactions)

### 2. Database Functions
- `is_pin_locked(p_pin_id)`: Check if pin is currently locked
- `unlock_expired_pins()`: Batch unlock pins past their lock period
- `increment_pin_use(p_pin_id, p_unlock_threshold)`: Increment use count and unlock if threshold reached

### 3. Feature Flags (`src/lib/features/pin-config.ts`)
```typescript
PIN_ON_FOLLOW: true          // Enable auto-pinning
PIN_LOCK_DAYS: 14            // Lock duration in days
PIN_MIN_INTERACTIONS: 3      // Early unlock threshold
PIN_ALLOW_FORCE_UNLOCK: false // Admin override (future)
PIN_MAX: 24                  // Max pins per user
```

### 4. Edge Function (`supabase/functions/auto-pin-business`)
- Idempotent pin creation/update
- Enforces PIN_MAX cap (evicts oldest auto-follow if needed)
- Won't overwrite manual pins
- Logs to `ai_action_ledger`
- Full error handling

### 5. Auto-Pin Integration
- `usePublicApps` hook updated to call edge function on follow
- Fires `pin_autocreated` event on success
- Toast notification: "Added to your dashboard"

### 6. Lock UI (`PinTile.tsx`)
- Shows lock icon for locked pins
- Displays "Auto-added · unlocks in X days"
- Tooltip explains lock reason
- Disabled unpin button while locked with informative tooltip

### 7. Pin Management (`useLockedPins.ts`)
- Loads all user pins with lock state
- `isLocked()`: Check if pin currently locked
- `canUnlock()`: Check if use threshold met
- `unpin()`: Prevents unpinning locked pins with toast
- `incrementUse()`: Tracks usage and auto-unlocks at threshold
- Real-time subscription for pin updates

### 8. UI Integration (`Pinboard.tsx`)
- Merges DB entity pins with local app pins
- Uses `PinTile` for locked pin display
- Increments use count on pin click
- Navigates to entity profile on click

### 9. Telemetry Events
All events wired through Rocker event bus:
- `pin_autocreated`: When pin is auto-created on follow
- `pin_used`: Each time user interacts with pin
- `pin_unlocked`: When pin unlocks (time or use-based)
- `pin_unpinned`: When user removes pin after unlock

## 🔐 Security
- RLS policies enforce user_id = auth.uid()
- Edge function uses service role but validates user context
- Lock checks happen server-side (can't be bypassed)

## 📊 Acceptance Criteria Met
✅ Follow business → auto-pin to dashboard  
✅ Pin is locked for 14 days OR 3 uses (whichever first)  
✅ Lock UI shows days remaining  
✅ Can't unpin while locked (shows helpful toast)  
✅ Auto-unlock on use threshold  
✅ Auto-unlock on time expiry  
✅ Idempotent (follow/unfollow/follow again works)  
✅ Enforces max pins (evicts oldest auto-follow)  
✅ Never overwrites manual pins  
✅ Full telemetry  
✅ Feature flags for easy rollout control  

## 🚀 Rollout Plan
1. ✅ Ship with PIN_LOCK_DAYS=14, PIN_MIN_INTERACTIONS=3
2. Monitor dashboards via telemetry events
3. AB test lock duration after 2-4 weeks
4. Adjust thresholds based on data

## 🔧 Admin Controls
- Feature flag kill switch: `PIN_ON_FOLLOW=false`
- Manual unlock (future): `PIN_ALLOW_FORCE_UNLOCK=true`
- Cleanup: `SELECT unlock_expired_pins();` (cron job ready)

---

**Status: 100% Complete & Production Ready** 🎉
