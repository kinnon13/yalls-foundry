/**
 * AI Context Compiler
 * Compiles user context for personalized AI interactions
 */

export interface ContextBundle {
  user_id: string;
  profile: {
    entities: string[];
    roles: string[];
    edges: any[];
  };
  preferences: Record<string, unknown>;
  activity: {
    posts_count: number;
    events_attended: number;
    last_active: string;
  };
  goals: string[];
  constraints: {
    quiet_hours?: [number, number];
    daily_cap?: number;
  };
  cold_start_score: number;
}

export async function compileContext(userId: string): Promise<ContextBundle> {
  // TODO: Wire to actual data sources
  return {
    user_id: userId,
    profile: {
      entities: [],
      roles: [],
      edges: [],
    },
    preferences: {},
    activity: {
      posts_count: 0,
      events_attended: 0,
      last_active: new Date().toISOString(),
    },
    goals: [],
    constraints: {},
    cold_start_score: 0.5,
  };
}

export function calculateColdStart(activity: ContextBundle['activity']): number {
  const score =
    (activity.posts_count * 0.3 + activity.events_attended * 0.7) / 10;
  return Math.min(1, Math.max(0, score));
}
