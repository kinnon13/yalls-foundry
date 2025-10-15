/**
 * Session Management Utilities
 * 
 * Handles session persistence, revocation, and step-up auth checks.
 */

import { supabase } from '@/integrations/supabase/client';
import { revokeSessions as revokeSessionsRPC, requiresStepUp as requiresStepUpRPC } from './adapters/supabase';

/**
 * Get current session from localStorage + Supabase
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Failed to get session:', error);
    return null;
  }
  return session;
}

/**
 * Revoke all sessions for user (admin or self)
 */
export async function revokeSessions(targetUserId?: string) {
  return revokeSessionsRPC(targetUserId);
}

/**
 * Check if action requires recent re-authentication
 */
export async function requiresStepUp(actionName: string): Promise<boolean> {
  return requiresStepUpRPC(actionName);
}

/**
 * Get last authentication time (for step-up checks)
 */
export function getLastAuthTime(): Date | null {
  const lastAuth = localStorage.getItem('last_auth_time');
  return lastAuth ? new Date(lastAuth) : null;
}

/**
 * Update last authentication time
 */
export function updateLastAuthTime() {
  localStorage.setItem('last_auth_time', new Date().toISOString());
}

/**
 * Check if step-up is needed (5 min threshold)
 */
export function needsStepUp(): boolean {
  const lastAuth = getLastAuthTime();
  if (!lastAuth) return true;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastAuth < fiveMinutesAgo;
}
