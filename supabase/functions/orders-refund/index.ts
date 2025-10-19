import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user with JWT
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('[orders-refund] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service client for privileged operations
    const svc = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { order_id, reason } = await req.json();
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[orders-refund] Processing refund for order:', order_id, 'reason:', reason);

    // Mark order as refunded (idempotent)
    const { error: updateError } = await svc
      .from('orders')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', order_id);

    if (updateError) {
      console.error('[orders-refund] Error updating order:', updateError);
      throw updateError;
    }

    // Find all commissions linked to this order that haven't been reversed
    const { data: commissions, error: queryError } = await svc
      .from('commission_ledger')
      .select('*')
      .eq('order_id', order_id)
      .is('reversed_at', null);

    if (queryError) {
      console.error('[orders-refund] Error querying commissions:', queryError);
      throw queryError;
    }

    console.log('[orders-refund] Found', commissions?.length ?? 0, 'commissions to reverse');

    // Create reversal entries for each commission
    for (const comm of commissions ?? []) {
      // Insert negative reversal row
      const { error: insertError } = await svc.from('commission_ledger').insert({
        order_id,
        user_id: comm.user_id,
        amount_cents: -Math.abs(comm.amount_cents ?? 0),
        currency: comm.currency ?? 'USD',
        amount_usd_cents: -Math.abs(comm.amount_usd_cents ?? comm.amount_cents ?? 0),
        type: comm.type,
        status: 'hold',
        meta: {
          reversal: true,
          reason: reason ?? 'Order refunded',
          reversal_of_id: comm.id
        },
        reversal_of_id: comm.id
      });

      if (insertError) {
        console.error('[orders-refund] Error inserting reversal:', insertError);
        throw insertError;
      }

      // Mark original commission as reversed
      const { error: markError } = await svc
        .from('commission_ledger')
        .update({ reversed_at: new Date().toISOString() })
        .eq('id', comm.id);

      if (markError) {
        console.error('[orders-refund] Error marking reversed:', markError);
        throw markError;
      }
    }

    console.log('[orders-refund] Successfully reversed', commissions?.length ?? 0, 'commissions');

    return new Response(
      JSON.stringify({ 
        ok: true, 
        reversed: commissions?.length ?? 0,
        order_id,
        status: 'refunded'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[orders-refund] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
