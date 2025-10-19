import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Rocker Discovery Job
 * 
 * Processes queued discovery tasks:
 * 1. Pull marketplace_discovery_queue WHERE status='queued'
 * 2. Check inventory for each interest's category
 * 3. Mark gaps (low/critical)
 * 4. Search for candidates (internal + future: partner APIs)
 * 5. Update status to done/error
 * 
 * Triggered: Cron (every 30-60 min) or manual
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get queued discoveries (limit batch)
    const { data: queue, error: queueError } = await supabase
      .from('marketplace_discovery_queue')
      .select('id, interest_id, category_id, reason, attempts')
      .eq('status', 'queued')
      .lt('attempts', 3)
      .order('created_at')
      .limit(20);

    if (queueError) throw queueError;
    if (!queue || queue.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No queued items' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = [];

    for (const item of queue) {
      try {
        // Mark processing
        await supabase
          .from('marketplace_discovery_queue')
          .update({ status: 'processing', attempts: item.attempts + 1 })
          .eq('id', item.id);

        // Check inventory for this category
        const { count: inventoryCount } = await supabase
          .from('marketplace_listings')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', item.category_id)
          .eq('status', 'active');

        const gapLevel = inventoryCount === 0 ? 'critical' : inventoryCount < 5 ? 'low' : 'none';

        // Upsert gap record
        await supabase
          .from('marketplace_gaps')
          .upsert({
            interest_id: item.interest_id,
            category_id: item.category_id,
            inventory_ct: inventoryCount || 0,
            gap_level: gapLevel,
            last_checked: new Date().toISOString()
          }, { onConflict: 'interest_id' });

        // If gap exists, try to find candidates
        if (gapLevel !== 'none') {
          // TODO: Implement partner API search here
          // For now, just log the gap
          console.log(`[Discovery] Gap detected: ${gapLevel} for interest ${item.interest_id}`);
          
          // Example: insert placeholder candidate
          // await supabase.from('marketplace_candidates').insert({
          //   interest_id: item.interest_id,
          //   category_id: item.category_id,
          //   source: 'placeholder',
          //   title: 'Coming soon',
          //   score: 0.5
          // });
        }

        // Mark done
        await supabase
          .from('marketplace_discovery_queue')
          .update({ status: 'done', updated_at: new Date().toISOString() })
          .eq('id', item.id);

        results.push({ id: item.id, status: 'done', gap_level: gapLevel });
      } catch (itemError) {
        console.error(`[Discovery] Error processing ${item.id}:`, itemError);
        
        // Mark error
        await supabase
          .from('marketplace_discovery_queue')
          .update({
            status: 'error',
            last_error: String(itemError),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        results.push({ id: item.id, status: 'error' });
      }
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Discovery] Top-level error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
