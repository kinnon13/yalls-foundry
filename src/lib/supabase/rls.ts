/**
 * RLS Policy Helpers
 * 
 * Utility functions for working with Row Level Security.
 * All queries automatically enforce RLS based on auth.uid().
 * 
 * Usage:
 *   import { getCurrentUserId, isAuthenticated } from '@/lib/supabase/rls';
 */

import { supabaseClient } from './client';

/**
 * Get current authenticated user ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user?.id ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}

/**
 * RLS enforcement notes:
 * 
 * - All tables have RLS enabled by default
 * - Queries automatically filter by auth.uid()
 * - Profiles: users can only modify their own
 * - Businesses: owners can modify, everyone can view
 * - Events: creators can modify, everyone can view
 * 
 * To add new policies:
 * 1. Write SQL in supabase/migrations/
 * 2. Use auth.uid() in USING/WITH CHECK clauses
 * 3. Test with different user contexts
 */