/**
 * Role: Tiered AI Kernel - Maps roles to AI capabilities
 * Path: src/lib/ai/tiered-kernel.ts
 */

import type { Role } from '@/apps/types';

export interface AICapability {
  id: string;
  action: string;
  minRole: Role;
  description: string;
}

// Tiered AI capabilities by role
const capabilities: AICapability[] = [
  // Anonymous - no AI
  
  // User tier
  { id: 'suggest.follow', action: 'suggest_follow', minRole: 'user', description: 'Get follow suggestions' },
  { id: 'curate.feed', action: 'curate_feed', minRole: 'user', description: 'Curate social feed' },
  
  // Admin tier (creators, business owners)
  { id: 'monetize.ideas', action: 'monetize_ideas', minRole: 'admin', description: 'Get monetization ideas' },
  { id: 'predict.churn', action: 'predict_churn', minRole: 'admin', description: 'Predict customer churn' },
  { id: 'forecast.revenue', action: 'forecast_revenue', minRole: 'admin', description: 'Revenue forecasting' },
  
  // Super admin tier
  { id: 'audit.system', action: 'audit_system', minRole: 'super', description: 'System audit' },
];

const roleHierarchy: Record<Role, number> = {
  anonymous: 0,
  user: 1,
  admin: 2,
  super: 3,
};

/**
 * Get capabilities available for a given role
 */
export function getCapabilities(userRole: Role): AICapability[] {
  const userLevel = roleHierarchy[userRole];
  return capabilities.filter(cap => roleHierarchy[cap.minRole] <= userLevel);
}

/**
 * Check if user has access to a capability
 */
export function hasCapability(userRole: Role, capabilityId: string): boolean {
  const capability = capabilities.find(c => c.id === capabilityId);
  if (!capability) return false;
  
  return roleHierarchy[userRole] >= roleHierarchy[capability.minRole];
}

/**
 * Get minimum required role for a capability
 */
export function getMinRole(capabilityId: string): Role | null {
  return capabilities.find(c => c.id === capabilityId)?.minRole ?? null;
}

/**
 * Execute an AI query (stub - connects to backend)
 */
export async function executeQuery(
  action: string,
  context: Record<string, any>
): Promise<{ result: string; error?: string }> {
  // Stub: In production, this would call edge function
  console.log('[AI Kernel] Executing:', action, context);
  
  // Simulate responses
  const responses: Record<string, string> = {
    suggest_follow: 'Follow @creator123 for similar content',
    curate_feed: 'Showing viral posts from your network',
    monetize_ideas: 'Try premium subscriptions or sponsored content',
    predict_churn: '12% churn risk in next 30 days',
    forecast_revenue: '$4.2K projected for next month',
  };
  
  return {
    result: responses[action] || 'AI processing...',
  };
}
