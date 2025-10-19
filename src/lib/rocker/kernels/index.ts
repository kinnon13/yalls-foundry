/**
 * Rocker AI Kernels
 * Small AI-powered "skills" that react to events
 */

export { generateNextBestActions } from './nba-generator';
export type { NextBestAction } from './nba-generator';

// Placeholder exports for other kernels mentioned in brief
export const postDisclosureCheck = async (content: string): Promise<{ safe: boolean; reason?: string }> => {
  // TODO: Check for required disclosures, sensitive info
  return { safe: true };
};

export const cartFollowupNudge = async (userId: string): Promise<boolean> => {
  // TODO: Check abandoned carts, send nudge if appropriate
  return false;
};

export const incentiveEligibilityHint = async (stallionId: string): Promise<string[]> => {
  // TODO: Check which programs the stallion qualifies for
  return [];
};

export const farmOverdueFlags = async (farmId: string): Promise<any[]> => {
  // TODO: Check overdue tasks, health checks, breeding schedules
  return [];
};

export const eventConflictDetector = async (eventId: string): Promise<string[]> => {
  // TODO: Check for scheduling conflicts
  return [];
};
