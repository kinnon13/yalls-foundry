/**
 * Rocker Integration: Entity Claims
 * 
 * Tracks entity views and nudges users to claim unclaimed entities.
 * Monitors claim windows and notifies contributors.
 */

import { supabase } from '@/integrations/supabase/client';

// Track entity views for claim nudging
const entityViews = new Map<string, Array<{ entityId: string; timestamp: number }>>();

/**
 * Track when a user views an unclaimed entity
 */
export async function trackEntityView(userId: string, entityId: string, entityStatus: string) {
  if (entityStatus !== 'unclaimed') return;

  const userViews = entityViews.get(userId) || [];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  // Clean old views
  const recentViews = userViews.filter(v => v.timestamp > weekAgo);
  
  // Add current view
  recentViews.push({ entityId, timestamp: Date.now() });
  entityViews.set(userId, recentViews);
  
  // Check if this entity has been viewed twice in the past week
  const entityViewCount = recentViews.filter(v => v.entityId === entityId).length;
  
  if (entityViewCount === 2) {
    // Nudge user to claim
    await supabase.rpc('rocker_log_action', {
      p_user_id: userId,
      p_agent: 'rocker',
      p_action: 'nudge_claim_entity',
      p_input: { entity_id: entityId, view_count: entityViewCount },
      p_output: { suggested: true },
      p_result: 'success'
    });
    
    // Return true to trigger UI nudge
    return true;
  }
  
  return false;
}

/**
 * Log when a user starts a claim
 */
export async function logClaimStarted(userId: string, entityId: string, method: string) {
  await supabase.rpc('rocker_log_action', {
    p_user_id: userId,
    p_agent: 'rocker',
    p_action: 'claim_entity_started',
    p_input: { entity_id: entityId, method },
    p_output: { opened_wizard: true },
    p_result: 'success'
  });
}

/**
 * Offer post-claim setup after approval
 */
export async function offerPostClaimSetup(userId: string, entityId: string, claimId: string) {
  await supabase.rpc('rocker_log_action', {
    p_user_id: userId,
    p_agent: 'rocker',
    p_action: 'offer_post_claim_setup',
    p_input: { entity_id: entityId, claim_id: claimId },
    p_output: { 
      offered: [
        'draft_storefront',
        'create_first_posts',
        'setup_listings'
      ]
    },
    p_result: 'success'
  });
}

/**
 * Check for expiring contributor windows and nudge
 */
export async function checkExpiringWindows(userId: string) {
  const { data: entities } = await supabase
    .from('entities')
    .select('id, display_name, window_expires_at')
    .eq('created_by_user_id', userId)
    .eq('status', 'unclaimed')
    .not('window_expires_at', 'is', null);
  
  if (!entities) return;
  
  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
  
  for (const entity of entities) {
    const expiresAt = new Date(entity.window_expires_at).getTime();
    
    if (expiresAt > Date.now() && expiresAt < sevenDaysFromNow) {
      // Nudge about expiring window
      await supabase.rpc('rocker_log_action', {
        p_user_id: userId,
        p_agent: 'rocker',
        p_action: 'nudge_expiring_window',
        p_input: { 
          entity_id: entity.id,
          entity_name: entity.display_name,
          days_left: Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        },
        p_output: { nudged: true },
        p_result: 'success'
      });
    }
  }
}

/**
 * Hook to call when claim is approved (webhook/trigger)
 */
export async function onClaimApproved(userId: string, entityId: string, claimId: string) {
  await offerPostClaimSetup(userId, entityId, claimId);
}
