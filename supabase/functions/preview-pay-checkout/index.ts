/**
 * Preview Payment Checkout - Mock Stripe checkout for development
 * Returns mock payment intent for testing
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('order_id required');
    }

    // Mock payment intent response
    const mockPaymentIntent = {
      id: `pi_mock_${crypto.randomUUID()}`,
      status: 'succeeded',
      amount: 5000, // Mock $50.00
      currency: 'usd',
      order_id,
      created: Date.now(),
    };

    console.log('Mock checkout created:', mockPaymentIntent);

    return new Response(JSON.stringify(mockPaymentIntent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
