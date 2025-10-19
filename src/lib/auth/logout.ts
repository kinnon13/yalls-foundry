/**
 * Canonical Logout Handler
 * 
 * Single source of truth for logout across entire app.
 * Clears session, storage, and emits telemetry.
 */

import { supabase } from '@/integrations/supabase/client';
import { emitRockerEvent } from '@/lib/ai/rocker/bus';
import { clearUser } from '@/lib/monitoring/sentry';

export async function logout(reason: 'user' | 'expired' | 'server' = 'user'): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Get current user before logout
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // 1. Server-side signOut
    await supabase.auth.signOut();
    
    // 2. Clear all client storage (preserve theme/locale preferences)
    const keysToPreserve = ['theme', 'locale'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
    
    // 3. Clear Sentry user context
    clearUser();
    
    // 4. Emit telemetry
    if (userId) {
      await emitRockerEvent('user.view.profile', userId, {
        action: 'logout',
        reason,
        duration_ms: Date.now() - startTime,
      });
    }
    
    // 5. Navigate to canonical auth
    window.location.href = '/auth?mode=login';
    
  } catch (err) {
    console.error('[Logout] Error during logout:', err);
    // Force navigation even on error
    window.location.href = '/auth?mode=login';
  }
}
