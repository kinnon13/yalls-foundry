import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, amountCents } = await req.json();
    
    if (!orderId || !amountCents) {
      throw new Error('Missing orderId or amountCents');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if we're in live mode
    const stripeMode = Deno.env.get('STRIPE_CONNECT') || 'disabled';
    
    if (stripeMode === 'live') {
      // Real Stripe integration would go here in Phase 8
      throw new Error('Live payments not yet enabled');
    }

    // Mock payment intent
    const { data: intent, error } = await supabase
      .from('payment_intents_mock')
      .insert({
        order_id: orderId,
        amount_cents: amountCents,
        status: 'pending',
        payment_method: 'mock',
        payload: { mock: true, created_at: new Date().toISOString() }
      })
      .select()
      .single();

    if (error) throw error;

    // Simulate immediate success for mock
    await supabase
      .from('payment_intents_mock')
      .update({ status: 'succeeded' })
      .eq('id', intent.id);

    return new Response(
      JSON.stringify({
        intentId: intent.id,
        status: 'succeeded',
        mock: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Payment intent error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
