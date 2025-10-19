import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[unlock-pins-cron] Running nightly unlock...');

    // Call the unlock RPC
    const { data, error } = await supabase.rpc('unlock_expired_pins');

    if (error) {
      console.error('[unlock-pins-cron] RPC error:', error);
      throw error;
    }

    const unlockedCount = data as number;
    console.log(`[unlock-pins-cron] Unlocked ${unlockedCount} pins`);

    // Log to AI ledger
    await supabase.from('ai_action_ledger').insert({
      user_id: null, // System action
      agent: 'cron',
      action: 'pins_unlocked_nightly',
      input: {},
      output: { unlockedCount },
      result: 'success',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        unlockedCount,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[unlock-pins-cron] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
