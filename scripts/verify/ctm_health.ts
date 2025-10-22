/**
 * CTM Health Verification Script
 * Checks that all CTM tables exist and are accessible
 */

import { supabase } from '@/integrations/supabase/client';

const CTM_TABLES = [
  'ai_conversations',
  'ai_messages',
  'ai_goals',
  'ai_goal_steps',
  'ai_bookmarks',
  'ai_context_snapshots',
  'ai_daily_reports',
  'ai_reminders',
];

async function checkTable(tableName: string): Promise<boolean> {
  try {
    const { count, error } = await (supabase as any)
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ ${tableName}: ${error.message}`);
      return false;
    }
    
    console.log(`✅ ${tableName}: ${count ?? 0} rows`);
    return true;
  } catch (error) {
    console.error(`❌ ${tableName}: Unexpected error`, error);
    return false;
  }
}

async function runHealthCheck(): Promise<void> {
  console.log('🔍 Running CTM Health Check...\n');
  
  let allHealthy = true;
  
  for (const table of CTM_TABLES) {
    const healthy = await checkTable(table);
    if (!healthy) {
      allHealthy = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allHealthy) {
    console.log('✅ All CTM tables are healthy!');
  } else {
    console.log('❌ Some CTM tables have issues. Check logs above.');
  }
}

// Run if executed directly
if (typeof window === 'undefined') {
  runHealthCheck().catch(console.error);
}

export { runHealthCheck, checkTable };
