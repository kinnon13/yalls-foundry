/**
 * Preview Payment Invoice - Mock invoice generation for development
 * Returns mock invoice data for testing
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
    const { boarder_id, period_start, period_end } = await req.json();

    if (!boarder_id) {
      throw new Error('boarder_id required');
    }

    // Mock invoice response
    const mockInvoice = {
      id: `inv_mock_${crypto.randomUUID()}`,
      boarder_id,
      period_start,
      period_end: period_end || new Date().toISOString(),
      status: 'draft',
      amount_due: 150000, // Mock $1,500.00
      currency: 'usd',
      created: Date.now(),
      line_items: [
        {
          description: 'Board - Full Care',
          amount: 100000,
          quantity: 1,
        },
        {
          description: 'Training Sessions',
          amount: 50000,
          quantity: 1,
        },
      ],
    };

    console.log('Mock invoice generated:', mockInvoice);

    return new Response(JSON.stringify(mockInvoice), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
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
