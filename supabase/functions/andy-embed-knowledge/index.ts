import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ai } from '../_shared/ai.ts';

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[andy-embed] Starting embedding generation...');

    // Get all rocker_knowledge entries without embeddings
    const { data: chunks, error: fetchError } = await supabase
      .from('rocker_knowledge')
      .select('id, content')
      .is('embedding', null)
      .limit(100); // Process 100 at a time

    if (fetchError) {
      console.error('[andy-embed] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!chunks || chunks.length === 0) {
      console.log('[andy-embed] No chunks to embed');
      return new Response(
        JSON.stringify({ message: 'No chunks to embed', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[andy-embed] Found ${chunks.length} chunks to embed`);

    // Generate embeddings in batches
    const texts = chunks.map(c => c.content);
    const embeddings = await ai.embed('knower', texts);

    console.log(`[andy-embed] Generated ${embeddings.length} embeddings`);

    // Update each chunk with its embedding
    let updated = 0;
    for (let i = 0; i < chunks.length; i++) {
      const { error: updateError } = await supabase
        .from('rocker_knowledge')
        .update({ embedding: embeddings[i] })
        .eq('id', chunks[i].id);

      if (updateError) {
        console.error(`[andy-embed] Update error for chunk ${chunks[i].id}:`, updateError);
      } else {
        updated++;
      }
    }

    console.log(`[andy-embed] Updated ${updated}/${chunks.length} chunks`);

    return new Response(
      JSON.stringify({
        message: 'Embeddings generated',
        processed: updated,
        total: chunks.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[andy-embed] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
