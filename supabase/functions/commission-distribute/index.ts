import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
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

    const { orderId } = await req.json();

    console.log('[commission-distribute] Processing order:', orderId);

    const { data, error } = await supabase.rpc('commission_distribute_dual_tree', {
      p_order_id: orderId
    });

    if (error) {
      console.error('[commission-distribute] Error:', error);
      throw error;
    }

    console.log('[commission-distribute] Success:', data);

    return new Response(
      JSON.stringify({ ok: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (e: any) {
    console.error('[commission-distribute] Fatal error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
