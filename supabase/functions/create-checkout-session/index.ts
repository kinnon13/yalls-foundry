import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const { cartItems } = await req.json();

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate total
    const total = cartItems.reduce((sum: number, item: any) => {
      return sum + (item.listing.price_cents * item.quantity);
    }, 0);

    // Create Stripe PaymentIntent
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: total.toString(),
        currency: 'usd',
        'metadata[user_id]': user.id,
      }).toString(),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('Stripe error:', errorText);
      throw new Error('Failed to create payment intent');
    }

    const paymentIntent = await stripeResponse.json();

    // Create order record (pending)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_user_id: user.id,
        total_cents: total,
        payment_status: 'pending',
        payment_intent_id: paymentIntent.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    // Create line items
    const lineItems = cartItems.map((item: any) => ({
      order_id: order.id,
      listing_id: item.listing.id,
      seller_business_id: item.listing.seller_business_id,
      quantity: item.quantity,
      price_cents: item.listing.price_cents,
    }));

    const { error: lineItemsError } = await supabase
      .from('order_line_items')
      .insert(lineItems);

    if (lineItemsError) {
      console.error('Line items error:', lineItemsError);
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        clientSecret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
