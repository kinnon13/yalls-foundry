/**
 * Create Checkout Session
 * 
 * Creates order and Stripe PaymentIntent for cart checkout
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';
import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'create-checkout', RateLimits.auth);
  if (limited) return limited;

  const log = createLogger('create-checkout-session');
  log.startTimer();

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Use account default API version (omit apiVersion)
    const stripe = new Stripe(stripeKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user?.email) {
      throw new Error('Authentication failed');
    }

    const { cart_id, idempotency_key } = await req.json();

    if (!cart_id || !idempotency_key) {
      throw new Error('Missing cart_id or idempotency_key');
    }

    log.info('Creating checkout', { cartId: cart_id, userId: user.id });

    // Start order via RPC (validates, creates order + line items)
    const { data: orderData, error: orderError } = await supabase.rpc('order_start_from_cart', {
      p_cart_id: cart_id,
      p_idempotency_key: idempotency_key,
    });

    if (orderError) {
      log.error('Order start failed', orderError);
      throw new Error(orderError.message || 'Failed to create order');
    }

    const [orderResult] = orderData as any[];
    if (!orderResult?.order_id) {
      throw new Error('No order_id returned');
    }

    const orderId = orderResult.order_id;

    // Get order details
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('total_cents, email')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      log.error('Failed to fetch order', fetchError);
      throw new Error('Failed to fetch order');
    }

    // Create Stripe PaymentIntent with idempotency
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: order.total_cents,
        currency: 'usd',
        receipt_email: order.email,
        metadata: {
          order_id: orderId,
          user_id: user.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      },
      {
        idempotencyKey: idempotency_key,
      }
    );

    // Update order with payment_intent_id
    await supabase
      .from('orders')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', orderId);

    log.info('Checkout session created', {
      orderId,
      paymentIntentId: paymentIntent.id,
    });

    return new Response(
      JSON.stringify({
        order_id: orderId,
        client_secret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log.error('Checkout error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
