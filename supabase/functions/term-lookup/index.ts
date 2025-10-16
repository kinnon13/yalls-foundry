import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'term-lookup', RateLimits.standard);
  if (limited) return limited;

  const log = createLogger('term-lookup');
  log.startTimer();

  try {
    const body = await req.json();
    const { term, action, source_type, source_url, title, summary, term_knowledge_id, vote } = body;
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Search for term
    if (action === 'search') {
      log.info('Searching for term', { term });
      
      // First check if we already have it
      const { data: existing } = await supabaseClient
        .from('term_knowledge')
        .select('*')
        .ilike('term', `%${term}%`)
        .eq('is_active', true)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ 
            found: true,
            definition: existing,
            source: 'database'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If not found, return a prompt to ask user or search web
      return new Response(
        JSON.stringify({
          found: false,
          suggestions: [
            `I'm not familiar with "${term}". Would you like me to:`,
            `1. Search the web for the definition`,
            `2. Let you explain what it means`,
            `3. Skip for now`
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Accept a definition (user-provided or web-sourced)
    if (action === 'accept') {
      
      log.info('Accepting definition', { term });
      
      const { data: newTerm, error } = await supabaseClient
        .from('term_knowledge')
        .insert({
          term,
          source_type,
          source_url,
          title,
          summary,
          added_by: user.id,
          is_active: true,
          confidence_score: source_type === 'web' ? 0.7 : 0.6
        })
        .select()
        .single();

      if (error) throw error;

      // Log resolution event
      await supabaseClient
        .from('term_resolution_events')
        .insert({
          user_id: user.id,
          term,
          term_knowledge_id: newTerm.id,
          method: source_type === 'web' ? 'web' : 'user_edit',
          resolved: true
        });

      return new Response(
        JSON.stringify({ success: true, term: newTerm }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vote on a term
    if (action === 'vote') {
      
      log.info('Voting on term', { term_knowledge_id, vote });
      
      // Upsert vote
      const { error: voteError } = await supabaseClient
        .from('term_votes')
        .upsert({
          term_knowledge_id,
          voter_user_id: user.id,
          vote: vote === 'up' ? 1 : -1,
          confidence: 4
        }, {
          onConflict: 'term_knowledge_id,voter_user_id'
        });

      if (voteError) throw voteError;

      // Update confidence score based on votes
      const { data: votes } = await supabaseClient
        .from('term_votes')
        .select('vote')
        .eq('term_knowledge_id', term_knowledge_id);

      const netScore = votes?.reduce((acc, v) => acc + v.vote, 0) || 0;
      const newConfidence = Math.min(Math.max(0.5 + (netScore * 0.1), 0), 1);

      await supabaseClient
        .from('term_knowledge')
        .update({ confidence_score: newConfidence })
        .eq('id', term_knowledge_id);

      return new Response(
        JSON.stringify({ success: true, netScore, confidence: newConfidence }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('Term lookup error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
