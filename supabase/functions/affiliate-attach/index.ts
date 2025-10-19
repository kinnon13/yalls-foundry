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

    const { partyKind, partyId, sponsorKind, sponsorId } = await req.json();

    console.log('[affiliate-attach] Attaching', { partyKind, partyId, sponsorKind, sponsorId });

    const { data, error } = await supabase.rpc('affiliate_attach', {
      p_party_kind: partyKind,
      p_party_id: partyId,
      p_sponsor_kind: sponsorKind,
      p_sponsor_id: sponsorId
    });

    if (error) {
      console.error('[affiliate-attach] Error:', error);
      throw error;
    }

    console.log('[affiliate-attach] Success:', data);

    return new Response(
      JSON.stringify({ ok: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (e: any) {
    console.error('[affiliate-attach] Fatal error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
