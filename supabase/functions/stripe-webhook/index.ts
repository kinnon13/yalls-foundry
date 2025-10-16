/**
 * Stripe Webhook Handler
 * 
 * Processes payment events to finalize orders
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';
import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Use account default API version
    const stripe = new Stripe(stripeKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        log.error('Webhook signature verification failed', err);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }), 
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      event = JSON.parse(body);
    }

    log.info('Webhook event received', { type: event.type, id: event.id });

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const idempotencyKey = `webhook_${event.id}`;

      // Check if already processed
      const { data: existingKey } = await supabase
        .from('idempotency_keys')
        .select('key')
        .eq('key', idempotencyKey)
        .maybeSingle();

      if (existingKey) {
        log.info('Webhook already processed', { eventId: event.id });
        return new Response(
          JSON.stringify({ received: true }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Record idempotency
      await supabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        scope: 'webhook',
      });

      // Find order by payment_intent_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, cart_id, user_id, total_cents')
        .eq('payment_intent_id', paymentIntent.id)
        .maybeSingle();

      if (orderError || !order) {
        log.error('Order not found', { paymentIntentId: paymentIntent.id, error: orderError });
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: corsHeaders }
        );
      }

      log.info('Processing order', { orderId: order.id });

      // Update order status to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id);

      if (updateError) {
        log.error('Failed to update order', updateError);
        throw updateError;
      }

      // Record payment
      await supabase.from('payments').insert({
        order_id: order.id,
        provider: 'stripe',
        intent_id: paymentIntent.id,
        amount_cents: paymentIntent.amount,
        status: 'succeeded',
        raw: paymentIntent,
      });

      // Create ledger entry
      await supabase.from('ledger_entries').insert({
        order_id: order.id,
        type: 'payment',
        amount_cents: paymentIntent.amount,
        notes: `Payment via Stripe: ${paymentIntent.id}`,
      });

      // Decrement inventory atomically
      const { data: lineItems } = await supabase
        .from('order_line_items')
        .select('listing_id, qty')
        .eq('order_id', order.id);

      if (lineItems && lineItems.length > 0) {
        for (const item of lineItems) {
          // Decrement stock using SQL update
          await supabase.rpc('decrement_listing_stock', {
            p_listing_id: item.listing_id,
            p_qty: item.qty,
          }).then(({ error }) => {
            if (error) {
              log.error('Failed to decrement stock', { listingId: item.listing_id, error });
            }
          });
        }
      }

      // Clear cart items
      if (order.cart_id) {
        await supabase
          .from('shopping_cart_items')
          .delete()
          .eq('cart_id', order.cart_id);

        await supabase
          .from('shopping_carts')
          .delete()
          .eq('id', order.cart_id);
      }

      log.info('Order finalized', { orderId: order.id });

      return new Response(
        JSON.stringify({ received: true, orderId: order.id }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('payment_intent_id', paymentIntent.id);

      if (updateError) {
        log.error('Failed to update failed order', updateError);
      }

      // Record failed payment
      await supabase.from('payments').insert({
        order_id: (paymentIntent.metadata as any).order_id,
        provider: 'stripe',
        intent_id: paymentIntent.id,
        amount_cents: paymentIntent.amount,
        status: 'failed',
        raw: paymentIntent,
      });

      log.info('Payment failed recorded', { paymentIntentId: paymentIntent.id });

      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Unknown event type
    log.info('Unhandled event type', { type: event.type });
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    log.error('Webhook error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
