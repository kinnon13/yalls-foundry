import { supabase } from '@/integrations/supabase/client';

/**
 * Get follow-up suggestions for contacts that haven't been contacted in a while
 * @param days Number of days of inactivity to consider (default: 14)
 * @returns Array of contacts needing follow-up with reasons
 */
export async function getFollowUps(days = 14) {
  // Query contacts with no recent events
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from('crm_contacts')
    .select('id, name, updated_at')
    .lt('updated_at', cutoff.toISOString())
    .limit(50);

  if (error) {
    console.error('Failed to fetch follow-ups:', error);
    return [];
  }

  return (data ?? []).map(c => ({
    contact_id: c.id,
    name: c.name,
    reason: `No activity since ${new Date(c.updated_at).toLocaleDateString()}`
  }));
}

/**
 * Log a CRM event for timeline tracking
 */
export async function logCRMEvent(
  contactId: string | null,
  kind: string,
  data: Record<string, any>
) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const { error } = await supabase.from('crm_events').insert({
    owner_user_id: user.id,
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
