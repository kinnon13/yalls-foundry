import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Social Matchmaker Job
 * 
 * Generates social suggestions based on interest overlap:
 * 1. Find users with similar interests
 * 2. Calculate overlap scores
 * 3. Insert suggestions (friend/creator/business/collab)
 * 4. Send reciprocal nudges to creators/businesses
 * 
 * Triggered: After interest selection, cron (every 2-4h), or manual
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's interests
    const { data: userInterests, error: interestsError } = await supabase
      .from('user_interests')
      .select('interest_id, affinity')
      .eq('user_id', user_id);

    if (interestsError) throw interestsError;
    if (!userInterests || userInterests.length === 0) {
      return new Response(JSON.stringify({ suggestions: 0, message: 'No interests found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const interestIds = userInterests.map(i => i.interest_id);

    // Find other users with overlapping interests
    const { data: candidates, error: candidatesError } = await supabase
      .from('user_interests')
      .select('user_id, interest_id')
      .in('interest_id', interestIds)
      .neq('user_id', user_id)
      .limit(100);

    if (candidatesError) throw candidatesError;

    // Calculate overlap scores
    const scores = new Map<string, { count: number; interests: Set<string> }>();
    
    candidates?.forEach(c => {
      if (!scores.has(c.user_id)) {
        scores.set(c.user_id, { count: 0, interests: new Set() });
      }
      const entry = scores.get(c.user_id)!;
      entry.count++;
      entry.interests.add(c.interest_id);
    });

    // Generate suggestions
    const suggestions = [];
    for (const [candidateId, { count, interests }] of scores.entries()) {
      const overlapScore = count / interestIds.length;
      
      if (overlapScore >= 0.3) { // 30% minimum overlap
        const sharedInterestIds = Array.from(interests);
        
        suggestions.push({
          user_id,
          kind: 'friend', // TODO: Detect creator/business from profile
          subject_kind: 'user',
          subject_id: candidateId,
          reason: `shared-interests:${count}`,
          overlap_score: overlapScore,
          features: {
            shared_interests: sharedInterestIds
          },
          status: 'new'
        });
      }
    }

    // Insert suggestions (dedupe via unique index)
    if (suggestions.length > 0) {
      const { error: insertError } = await supabase
        .from('social_suggestions')
        .upsert(suggestions, {
          onConflict: 'user_id,kind,subject_kind,subject_id',
          ignoreDuplicates: true
        });

      if (insertError) console.error('[Matchmaker] Insert error:', insertError);
    }

    return new Response(JSON.stringify({
      user_id,
      suggestions: suggestions.length,
      top_matches: suggestions.slice(0, 5).map(s => ({
        subject_id: s.subject_id,
        overlap_score: s.overlap_score
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Matchmaker] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
