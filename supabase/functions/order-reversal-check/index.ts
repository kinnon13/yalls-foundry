import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    console.log('[order-reversal-check] Starting...');

    // Reverse orders without labels after 7 days
    const { data: reversalData, error: reversalError } = await supabase.rpc('order_reverse_unlabeled');
    if (reversalError) {
      console.error('[order-reversal-check] Reversal error:', reversalError);
      throw reversalError;
    }

    // Release commissions where label printed + 14 days passed
    const { data: releaseData, error: releaseError } = await supabase.rpc('commission_check_release');
    if (releaseError) {
      console.error('[order-reversal-check] Release error:', releaseError);
      throw releaseError;
    }

    console.log('[order-reversal-check] Complete:', { 
      reversed: reversalData,
      released: releaseData 
    });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        reversed: reversalData,
        released: releaseData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (e: any) {
    console.error('[order-reversal-check] Fatal error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
