/**
 * Reminder Worker
 * Sends due reminders to users
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Find due reminders
 */
async function findDueReminders(): Promise<any[]> {
  const now = new Date().toISOString();
  
  try {
    const { data } = await (supabase as any)
      .from('ai_reminders')
      .select('id, tenant_id, user_id, goal_id, message, channel')
      .lte('remind_at', now)
      .is('sent_at', null)
      .limit(100);
    
    return data || [];
  } catch (error) {
    console.error('[Reminder] Error finding due reminders:', error);
    return [];
  }
}

/**
 * Send a reminder (stub - implement actual delivery)
 */
async function sendReminder(reminder: any): Promise<boolean> {
  try {
    console.log(`[Reminder] Sending reminder ${reminder.id} via ${reminder.channel}`);
    
    // TODO: Implement actual delivery
    // - in_app: Store in notifications table
    // - email: Send via email service
    // - sms: Send via SMS service
    
    // Mark as sent
    await (supabase as any)
      .from('ai_reminders')
      .update({
        sent_at: new Date().toISOString(),
      })
      .eq('id', reminder.id);
    
    return true;
  } catch (error) {
    console.error('[Reminder] Error sending reminder:', error);
    return false;
  }
}

/**
 * Run reminder worker
 */
export async function runReminders(): Promise<number> {
  console.log('[Reminder] Starting run...');
  
  const reminders = await findDueReminders();
  let sent = 0;
  
  for (const reminder of reminders) {
    const success = await sendReminder(reminder);
    if (success) {
      sent++;
    }
  }
  
  if (sent > 0) {
    console.log(`[Reminder] Sent ${sent} reminders`);
  }
  
  return sent;
}

// For standalone execution or cron
if (typeof require !== 'undefined' && require.main === module) {
  runReminders().then(count => {
    console.log(`[Reminder] Completed: ${count} reminders`);
  });
}
