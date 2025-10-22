/**
 * Daily Report Worker
 * Generates morning reports for users with pending tasks
 */

import { supabase } from '@/integrations/supabase/client';
import { generateDailyReport } from '@/ai/shared/conversation/summarize';

/**
 * Find users with pending goals or bookmarks
 */
async function findUsersNeedingReports(): Promise<Array<{
  tenant_id: string;
  user_id: string;
}>> {
  try {
    // Users with pending goals
    const { data: usersWithGoals } = await (supabase as any)
      .from('ai_goals')
      .select('tenant_id, user_id')
      .in('status', ['pending', 'in_progress'])
      .limit(1000);
    
    // Users with unresolved bookmarks
    const { data: usersWithBookmarks } = await (supabase as any)
      .from('ai_bookmarks')
      .select('conversation:ai_conversations(tenant_id, user_id)')
      .is('resumed_at', null)
      .limit(1000);
    
    const users = new Map<string, { tenant_id: string; user_id: string }>();
    
    if (usersWithGoals) {
      for (const u of usersWithGoals) {
        const key = `${u.tenant_id}:${u.user_id}`;
        users.set(key, { tenant_id: u.tenant_id, user_id: u.user_id });
      }
    }
    
    if (usersWithBookmarks) {
      for (const b of usersWithBookmarks) {
        if (b.conversation) {
          const key = `${b.conversation.tenant_id}:${b.conversation.user_id}`;
          users.set(key, {
            tenant_id: b.conversation.tenant_id,
            user_id: b.conversation.user_id,
          });
        }
      }
    }
    
    return Array.from(users.values());
  } catch (error) {
    console.error('[DailyReport] Error finding users:', error);
    return [];
  }
}

/**
 * Generate report for one user
 */
async function generateReportForUser(
  tenantId: string,
  userId: string,
  reportDate: Date
): Promise<boolean> {
  try {
    // Get goals
    const { data: goals } = await (supabase as any)
      .from('ai_goals')
      .select('id, title, status, priority')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: true })
      .limit(10);
    
    // Get bookmarks
    const { data: bookmarks } = await (supabase as any)
      .from('ai_bookmarks')
      .select('id, label, created_at')
      .is('resumed_at', null)
      .limit(5);
    
    // Generate markdown
    const markdown = await generateDailyReport(
      userId,
      reportDate,
      goals || [],
      bookmarks || []
    );
    
    // Store report
    await (supabase as any)
      .from('ai_daily_reports')
      .upsert({
        tenant_id: tenantId,
        user_id: userId,
        report_date: reportDate.toISOString().slice(0, 10),
        summary_md: markdown,
      }, {
        onConflict: 'tenant_id,user_id,report_date'
      });
    
    return true;
  } catch (error) {
    console.error('[DailyReport] Error generating report:', error);
    return false;
  }
}

/**
 * Run daily report worker
 */
export async function runDailyReport(): Promise<number> {
  console.log('[DailyReport] Starting run...');
  
  const today = new Date();
  const users = await findUsersNeedingReports();
  let generated = 0;
  
  for (const user of users) {
    const success = await generateReportForUser(
      user.tenant_id,
      user.user_id,
      today
    );
    if (success) {
      generated++;
    }
  }
  
  console.log(`[DailyReport] Generated ${generated} reports`);
  return generated;
}

// For standalone execution or cron
if (typeof require !== 'undefined' && require.main === module) {
  runDailyReport().then(count => {
    console.log(`[DailyReport] Completed: ${count} reports`);
  });
}
