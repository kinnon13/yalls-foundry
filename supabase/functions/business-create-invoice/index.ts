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

    const { businessId, contactId, amount } = await req.json();

    console.log('[business-create-invoice] Creating invoice:', { businessId, contactId, amount });

    // Insert invoice
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        business_id: businessId,
        contact_id: contactId,
        amount,
        status: 'draft',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[business-create-invoice] Error:', error);
      throw error;
    }

    // Stub: Sync to QuickBooks API
    console.log('[business-create-invoice] QuickBooks sync (stub):', data.id);

    return new Response(
      JSON.stringify({ ok: true, invoice_id: data.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (e: any) {
    console.error('[business-create-invoice] Fatal error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
