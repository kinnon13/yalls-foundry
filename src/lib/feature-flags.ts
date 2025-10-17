// Feature flags for gradual rollout and kill switches

export interface FeatureFlag {
  rollout: number; // 0.0 to 1.0 (percentage of users)
  kill_switch: boolean;
  metadata?: Record<string, any>;
}

export const FLAGS: Record<string, FeatureFlag> = {
  profile_pins: { 
    rollout: 0.0, // Start at 0%, gradually increase
    kill_switch: false 
  },
  favorites: { 
    rollout: 0.0, 
    kill_switch: false 
  },
  reposts: { 
    rollout: 0.0, 
    kill_switch: false 
  },
  linked_accounts: { 
    rollout: 0.0, 
    kill_switch: false 
  },
  entity_edges: { 
    rollout: 0.0, 
    kill_switch: false 
  },
  nba_modal: { 
    rollout: 0.0, 
    kill_switch: false 
  },
  notification_lanes: {
    rollout: 0.0,
    kill_switch: false
  },
  composer_crosspost: {
    rollout: 0.0,
    kill_switch: false
  },
};

// Deterministic rollout based on user ID
export function isFeatureEnabled(
  flagName: keyof typeof FLAGS, 
  userId: string
): boolean {
  const flag = FLAGS[flagName];
  
  if (!flag) return false;
  if (flag.kill_switch) return false;
  if (flag.rollout >= 1.0) return true;
  if (flag.rollout <= 0.0) return false;
  
  // Consistent hash-based rollout
  const hash = hashUserId(userId);
  return hash < flag.rollout;
}

// Simple hash function for consistent user bucketing
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

// Admin override (for testing)
export function forceEnableFeature(flagName: keyof typeof FLAGS) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`flag_${flagName}`, 'true');
  }
}

export function isForcedEnabled(flagName: keyof typeof FLAGS): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(`flag_${flagName}`) === 'true';
}
