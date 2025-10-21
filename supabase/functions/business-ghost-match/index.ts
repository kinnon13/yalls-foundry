/**
 * Business Ghost Match
 * Finds potential existing businesses that match user input
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, website, phone } = await req.json();

    if (!name || name.trim().length < 2) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for ghost entities (unclaimed businesses)
    const { data: entities, error } = await supabase
      .from('entities')
      .select('id, name, slug, website, phone')
      .eq('kind', 'business')
      .is('owner_id', null) // Ghost entities have no owner
      .ilike('name', `%${name.trim()}%`)
      .limit(5);

    if (error) {
      console.error('[GhostMatch] Query error:', error);
      throw error;
    }

    if (!entities || entities.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate match scores
    const matches = entities.map(entity => {
      let score = 0.5; // Base score for name match

      // Boost score if website matches
      if (website && entity.website && 
          entity.website.toLowerCase().includes(website.toLowerCase())) {
        score += 0.3;
      }

      // Boost score if phone matches
      if (phone && entity.phone && 
          entity.phone.replace(/\D/g, '').includes(phone.replace(/\D/g, ''))) {
        score += 0.2;
      }

      return {
        entity_id: entity.id,
        name: entity.name,
        slug: entity.slug,
        website: entity.website,
        phone: entity.phone,
        score: Math.min(score, 1.0)
      };
    });

    // Sort by score, return top matches
    matches.sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({ matches: matches.slice(0, 3) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GhostMatch] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, matches: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
