/**
 * Role: Tiered AI model definitions
 * Path: yalls-inc/yalls-ai/libs/models/tiered.model.ts
 */

export type Role = 'user' | 'creator' | 'business';

export interface Capability {
  id: string;
  name: string;
  tier: Role;
  cost: number; // AI tokens per query
  rateLimit: number; // Queries per minute
}

export const CAPABILITIES: Capability[] = [
  // User tier (basic)
  {
    id: 'suggest.follow',
    name: 'Follow Suggestions',
    tier: 'user',
    cost: 100,
    rateLimit: 10,
  },
  {
    id: 'discover.content',
    name: 'Content Discovery',
    tier: 'user',
    cost: 150,
    rateLimit: 10,
  },
  {
    id: 'personalize.feed',
    name: 'Personalize Feed',
    tier: 'user',
    cost: 200,
    rateLimit: 5,
  },

  // Creator tier (mid)
  {
    id: 'monetize.ideas',
    name: 'Monetization Ideas',
    tier: 'creator',
    cost: 500,
    rateLimit: 5,
  },
  {
    id: 'audience.insights',
    name: 'Audience Insights',
    tier: 'creator',
    cost: 700,
    rateLimit: 3,
  },
  {
    id: 'content.optimize',
    name: 'Content Optimization',
    tier: 'creator',
    cost: 600,
    rateLimit: 5,
  },

  // Business tier (advanced)
  {
    id: 'forecast.revenue',
    name: 'Revenue Forecasting',
    tier: 'business',
    cost: 1000,
    rateLimit: 3,
  },
  {
    id: 'optimize.inventory',
    name: 'Inventory Optimization',
    tier: 'business',
    cost: 1200,
    rateLimit: 2,
  },
  {
    id: 'predict.churn',
    name: 'Churn Prediction',
    tier: 'business',
    cost: 1500,
    rateLimit: 2,
  },
];

export interface AIQuery {
  userId: string;
  role: Role;
  capability: string;
  context: Record<string, any>;
  timestamp: Date;
}

export interface AIResponse {
  suggestion: string;
  confidence: number;
  source: 'user-tier' | 'creator-tier' | 'business-tier';
  tokensUsed: number;
}
