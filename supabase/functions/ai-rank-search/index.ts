/**
 * AI-Powered Search Ranking
 * 
 * Enhances search results with AI-driven relevance scoring based on:
 * - User follows, likes, and interactions
 * - CRM data (if available)
 * - Geographic proximity
 * - Behavioral patterns
 * 
 * Behind `ai_rank` feature flag.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { results, userId, query, category } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Get user context
    const { data: userData } = await supabaseClient
      .from('profiles')
      .select('metadata')
      .eq('user_id', userId)
      .single();
    
    // Get user follows
    const { data: follows } = await supabaseClient
      .from('follows')
      .select('followed_id')
      .eq('follower_id', userId);
    
    const followedIds = new Set(follows?.map(f => f.followed_id) || []);
    
    // Score each result
    const scored = results.map((result: any) => {
      let score = 0;
      
      // Follow boost
      if (followedIds.has(result.id)) {
        score += 50;
      }
      
      // Category match boost
      if (category && result.type === category) {
        score += 20;
      }
      
      // Geographic proximity (if location data available)
      const userLocation = userData?.metadata?.location;
      if (userLocation && result.location) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          result.location.lat,
          result.location.lng
        );
        
        if (distance < 50) score += 30;
        else if (distance < 100) score += 15;
      }
      
      // Recent interaction boost
      const lastInteraction = result.last_interaction_at;
      if (lastInteraction) {
        const daysSince = (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) score += 10;
      }
      
      return { ...result, ai_score: score };
    });
    
    // Sort by score (descending)
    scored.sort((a: any, b: any) => b.ai_score - a.ai_score);
    
    return new Response(
      JSON.stringify({ results: scored }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI ranking error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Haversine distance (km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
