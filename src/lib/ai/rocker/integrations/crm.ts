import { supabase } from '@/integrations/supabase/client';

/**
 * Get follow-up suggestions for contacts that haven't been contacted in a while
 * @param days Number of days of inactivity to consider (default: 14)
 * @returns Array of contacts needing follow-up with reasons
 */
export async function getFollowUps(days = 14) {
  const { data, error } = await supabase.rpc('rocker_generate_followup_list', {
    p_days_idle: days
  });

  if (error) {
    console.error('Failed to fetch follow-ups:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Log a CRM event for timeline tracking
 */
export async function logCRMEvent(
  contactId: string | null,
  kind: string,
  data: Record<string, any>
) {
  const { error } = await supabase.from('crm_events').insert({
    contact_id: contactId,
    kind,
    data,
    happened_at: new Date().toISOString()
  });

  if (error) {
    console.error('Failed to log CRM event:', error);
  }
}

/**
 * Get recent CRM events for a contact
 */
export async function getContactTimeline(contactId: string, limit = 50) {
  const { data, error } = await supabase
    .from('crm_events')
    .select('*')
    .eq('contact_id', contactId)
    .order('happened_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch contact timeline:', error);
    return [];
  }

  return data ?? [];
}
