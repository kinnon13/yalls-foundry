/**
 * Policy Guard
 * Enforces quiet hours, rate limits, permissions
 */

import { rocker } from '@/lib/rocker/event-bus';

interface PolicyConfig {
  quietHoursStart?: number; // 0-23
  quietHoursEnd?: number;
  dailyActionCap?: number;
  enableRLS?: boolean;
}

class PolicyGuard {
  private config: PolicyConfig = {
    quietHoursStart: 22, // 10 PM
    quietHoursEnd: 7,    // 7 AM
    dailyActionCap: 100,
    enableRLS: true,
  };

  private actionCounts: Map<string, { count: number; date: string }> = new Map();

  /**
   * Update policy config
   */
  configure(config: Partial<PolicyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if action is allowed
   */
  checkPolicy(userId: string, action: string): { allowed: boolean; reason?: string } {
    // Quiet hours
    if (this.isQuietHours()) {
      rocker.emit('policy_quiet_hours', { metadata: { userId, action } });
      return { allowed: false, reason: 'Quiet hours active' };
    }

    // Daily cap
    const key = `${userId}:${new Date().toISOString().split('T')[0]}`;
    const entry = this.actionCounts.get(key) || { count: 0, date: key };
    
    if (entry.count >= (this.config.dailyActionCap || 100)) {
      rocker.emit('policy_daily_cap', { metadata: { userId, action, count: entry.count } });
      return { allowed: false, reason: 'Daily action cap reached' };
    }

    // Increment
    this.actionCounts.set(key, { count: entry.count + 1, date: entry.date });

    return { allowed: true };
  }

  /**
   * Check if quiet hours active
   */
  isQuietHours(): boolean {
    const hour = new Date().getHours();
    const start = this.config.quietHoursStart || 22;
    const end = this.config.quietHoursEnd || 7;

    if (start > end) {
      // Wraps midnight
      return hour >= start || hour < end;
    }
    return hour >= start && hour < end;
  }

  /**
   * Check ownership
   */
  checkOwnership(userId: string, resourceOwnerId: string): boolean {
    // TODO: Add role/membership checks
    return userId === resourceOwnerId;
  }

  /**
   * Reset daily counts (call at midnight)
   */
  resetDailyCounts(): void {
    const today = new Date().toISOString().split('T')[0];
    for (const [key, entry] of this.actionCounts.entries()) {
      if (entry.date !== today) {
        this.actionCounts.delete(key);
      }
    }
  }
}

export const policyGuard = new PolicyGuard();
