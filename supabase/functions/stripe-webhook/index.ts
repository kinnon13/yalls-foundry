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

  const limited = await withRateLimit(req, 'stripe-webhook', RateLimits.high);
  if (limited) return limited;

  const log = createLogger('stripe-webhook');
  log.startTimer();

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const supabase = createClient(supabaseUrl, supabaseKey);

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        log.error('Webhook signature verification failed', err);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: corsHeaders });
      }
    } else {
      event = JSON.parse(body);
    }

    log.info('Webhook event received', { type: event.type });

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const idempotencyKey = `pi_${paymentIntent.id}`;

      // Check idempotency
      const { data: existingKey } = await supabase
        .from('idempotency_keys')
        .select('key')
        .eq('key', idempotencyKey)
        .maybeSingle();

      if (existingKey) {
        log.info('Payment already processed', { idempotencyKey });
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
      }

      // Find order by payment_intent_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_intent_id', paymentIntent.id)
        .maybeSingle();

      if (orderError || !order) {
        log.error('Order not found', orderError, { paymentIntentId: paymentIntent.id });
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: corsHeaders });
      }

      // Update order to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) {
        log.error('Failed to update order', updateError);
        throw updateError;
      }

      // Record idempotency key
      await supabase
        .from('idempotency_keys')
        .insert({ key: idempotencyKey, order_id: order.id });

      // Create ledger entry
      await supabase
        .from('ledger_entries')
        .insert({
          idempotency_key: `ledger_${idempotencyKey}`,
          entry_type: 'order_payment',
          order_id: order.id,
          user_id: order.buyer_user_id,
          amount_cents: order.total_cents,
          balance_cents: 0, // Will be calculated by balance tracking system
        });

      log.info('Order marked as paid', { orderId: order.id });

      // Clear cart
      await supabase
        .from('shopping_carts')
        .delete()
        .eq('user_id', order.buyer_user_id);

      return new Response(
        JSON.stringify({ received: true, orderId: order.id }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('payment_intent_id', paymentIntent.id);

      log.info('Payment failed', { paymentIntentId: paymentIntent.id });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    log.error('Webhook error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
