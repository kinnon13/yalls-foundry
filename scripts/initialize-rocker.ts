/**
 * Rocker Initialization Script
 * 
 * Initializes all required configuration for Rocker proactivity:
 * - voice_preferences
 * - runtime_flags
 * - super_admin_settings
 * 
 * Usage:
 *   1. Via edge function: Deploy and invoke
 *   2. Local with Deno: deno run --allow-net --allow-env scripts/initialize-rocker.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://xuxfuonzsfvrirdwzddt.supabase.co';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZ1b256c2Z2cmlyZHd6ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDYyODMsImV4cCI6MjA3NjAyMjI4M30.Wza_NmUlFgT_NFuPsPw0ER8GAXgcU8OtEhvu-o_GCBg';

async function initializeRocker(userId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log(`🚀 Initializing Rocker for user: ${userId}`);

  try {
    // 1. Initialize voice_preferences
    console.log('📞 Setting up voice preferences...');
    const { error: voiceError } = await supabase
      .from('voice_preferences')
      .upsert({
        user_id: userId,
        allow_voice_calls: true,
        allow_voice_messages: true,
        preferred_voice: 'alloy',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (voiceError) {
      console.error('❌ Voice preferences error:', voiceError);
    } else {
      console.log('✅ Voice preferences configured');
    }

    // 2. Initialize runtime_flags
    console.log('⚙️  Setting up runtime flags...');
    const flags = [
      { flag_name: 'rocker.always_on', flag_value: 'true', description: 'Enable Rocker proactive features' },
      { flag_name: 'rocker.daily_checkin', flag_value: '09:00', description: 'Daily check-in at 9 AM' },
      { flag_name: 'rocker.evening_wrap', flag_value: '20:00', description: 'Evening wrap-up at 8 PM' },
      { flag_name: 'rocker.task_nag', flag_value: '120', description: 'Task reminder every 120 minutes' },
      { flag_name: 'rocker.channel.web', flag_value: 'true', description: 'Enable web notifications' },
      { flag_name: 'rocker.channel.sms', flag_value: 'false', description: 'SMS channel (disabled by default)' },
      { flag_name: 'rocker.channel.whatsapp', flag_value: 'false', description: 'WhatsApp channel (disabled by default)' },
    ];

    for (const flag of flags) {
      const { error: flagError } = await supabase
        .from('runtime_flags')
        .upsert({
          flag_name: flag.flag_name,
          flag_value: flag.flag_value,
          description: flag.description,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'flag_name' });

      if (flagError) {
        console.error(`❌ Flag ${flag.flag_name} error:`, flagError);
      }
    }
    console.log('✅ Runtime flags configured');

    // 3. Initialize super_admin_settings
    console.log('👑 Setting up super admin settings...');
    const { error: adminError } = await supabase
      .from('super_admin_settings')
      .upsert({
        user_id: userId,
        rocker_obedience_level: 'balanced',
        allow_proactive_suggestions: true,
        allow_memory_ingest: true,
        allow_global_knowledge_write: true,
        allow_global_knowledge_publish: true,
        allow_hypothesis_write: true,
        allow_change_proposal_create: true,
        allow_calendar_access: true,
        allow_audit_log: true,
        allow_entity_management: true,
        allow_feature_flag_override: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (adminError) {
      console.error('❌ Super admin settings error:', adminError);
    } else {
      console.log('✅ Super admin settings configured');
    }

    // 4. Verify configuration
    console.log('\n🔍 Verifying configuration...\n');
    
    const { data: voiceData } = await supabase
      .from('voice_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    console.log('Voice Preferences:', voiceData ? '✅' : '❌');

    const { data: flagsData, count: flagsCount } = await supabase
      .from('runtime_flags')
      .select('*', { count: 'exact' })
      .like('flag_name', 'rocker.%');
    console.log(`Runtime Flags: ${flagsCount || 0} configured`);

    const { data: adminData } = await supabase
      .from('super_admin_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    console.log('Super Admin Settings:', adminData ? '✅' : '❌');

    // 5. Send test notification
    console.log('\n📨 Sending test notification...');
    const { error: testError } = await supabase.rpc('rocker_dm', {
      p_user_id: userId,
      p_text: '🎉 Rocker initialization complete! All systems operational.',
      p_source: 'system',
      p_channel: 'web',
    });

    if (testError) {
      console.error('❌ Test notification error:', testError);
    } else {
      console.log('✅ Test notification sent');
    }

    console.log('\n✨ Rocker initialization complete!\n');
    console.log('Next steps:');
    console.log('1. Check rocker_notifications table for test message');
    console.log('2. Verify cron jobs are running in Supabase dashboard');
    console.log('3. Test proactive features by waiting for daily check-in');
    console.log('\nManual test command:');
    console.log(`  SELECT rocker_dm('${userId}', 'Test message', 'manual', 'web');`);

    return { success: true, userId };

  } catch (error: any) {
    console.error('❌ Initialization failed:', error);
    return { success: false, error: error.message };
  }
}

// Main execution
if (import.meta.main) {
  const userId = Deno.args[0] || 'f6952613-af22-467d-b790-06dfc7efbdbd';
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Rocker Initialization Script v1.0  ║');
  console.log('╚═══════════════════════════════════════╝\n');
  
  const result = await initializeRocker(userId);
  Deno.exit(result.success ? 0 : 1);
}

// Export for use as module
export { initializeRocker };
