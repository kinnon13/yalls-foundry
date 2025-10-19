/**
 * Rocker Discovery Job
 * 
 * Processes queued discovery tasks by checking marketplace inventory
 * and identifying gaps to fill with candidates.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: queuedItems, error: queueError } = await supabase
      .from('marketplace_discovery_queue')
      .select('*')
      .eq('status', 'queued')
      .limit(20);

    if (queueError) throw queueError;
    if (!queuedItems || queuedItems.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No queued items' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const item of queuedItems) {
      try {
        await supabase
          .from('marketplace_discovery_queue')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', item.id);

        const { count: inventoryCount } = await supabase
          .from('marketplace_listings')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', item.category_id)
          .eq('status', 'active');

        const count = inventoryCount ?? 0;
        let gapLevel = 'none';
        if (count === 0) gapLevel = 'critical';
        else if (count < 5) gapLevel = 'low';

        await supabase
          .from('marketplace_gaps')
          .upsert({
            interest_id: item.interest_id,
            category_id: item.category_id,
            inventory_ct: count,
            gap_level: gapLevel,
            last_checked: new Date().toISOString()
          }, { onConflict: 'interest_id' });

        results.push({
          interest_id: item.interest_id,
          category_id: item.category_id,
          gap_level: gapLevel,
          inventory_count: count
        });

        await supabase
          .from('marketplace_discovery_queue')
          .update({ status: 'done', updated_at: new Date().toISOString() })
          .eq('id', item.id);

      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
        const errorMessage = itemError instanceof Error ? itemError.message : String(itemError);
        await supabase
          .from('marketplace_discovery_queue')
          .update({
            status: 'error',
            last_error: errorMessage,
            attempts: item.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Discovery job error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
