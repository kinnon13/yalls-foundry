/**
 * Role: Yallspay payment processing edge function - MLM commission splits
 * Path: supabase/functions/yallspay-process-payment/index.ts
 */

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, amount, productId, gateway, uplineChain } = await req.json();

    if (!userId || !amount || !productId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate commission splits (3-tier MLM: 10/20/30/5%)
    const platformFee = amount * 0.05;
    const upline1 = amount * 0.10;
    const upline2 = upline1 * 0.20;
    const upline3 = upline2 * 0.30;
    const userAmount = amount - upline1 - platformFee;

    const splits = {
      user: parseFloat(userAmount.toFixed(2)),
      upline1: parseFloat(upline1.toFixed(2)),
      upline2: parseFloat(upline2.toFixed(2)),
      upline3: parseFloat(upline3.toFixed(2)),
      platform: parseFloat(platformFee.toFixed(2)),
      total: amount,
    };

    // Insert payment record
    const { data: payment, error } = await supabase
      .from('yallspay_payments')
      .insert({
        user_id: userId,
        amount,
        product_id: productId,
        gateway: gateway || 'stripe',
        status: 'completed',
        splits,
        upline_chain: uplineChain || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Distribute commissions (stub - would call Stripe/Venmo in production)
    if (uplineChain && uplineChain.length > 0) {
      const residualPromises = [];

      // Level 1: Direct upline
      if (uplineChain[0]) {
        residualPromises.push(
          supabase.from('yallspay_residuals').insert({
            user_id: uplineChain[0],
            amount: splits.upline1,
            level: 1,
            source_payment_id: payment.id,
            source_user_id: userId,
          })
        );
      }

      // Level 2: Second tier
      if (uplineChain[1]) {
        residualPromises.push(
          supabase.from('yallspay_residuals').insert({
            user_id: uplineChain[1],
            amount: splits.upline2,
            level: 2,
            source_payment_id: payment.id,
            source_user_id: userId,
          })
        );
      }

      // Level 3: Third tier
      if (uplineChain[2]) {
        residualPromises.push(
          supabase.from('yallspay_residuals').insert({
            user_id: uplineChain[2],
            amount: splits.upline3,
            level: 3,
            source_payment_id: payment.id,
            source_user_id: userId,
          })
        );
      }

      await Promise.all(residualPromises);
    }

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        splits,
        message: 'Payment processed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Yallspay payment processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
