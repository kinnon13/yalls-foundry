/**
 * Role: Yalls AI query edge function - role-gated AI oracle
 * Path: supabase/functions/yalls-ai-query/index.ts
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

    const { role, action, context } = await req.json();

    if (!role || !action) {
      return new Response(JSON.stringify({ error: 'Missing role or action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Capability gate check
    const capabilityMap: Record<string, string[]> = {
      user: ['suggest.follow', 'discover.content', 'personalize.feed'],
      creator: [
        'suggest.follow',
        'discover.content',
        'personalize.feed',
        'monetize.ideas',
        'audience.insights',
        'content.optimize',
      ],
      business: [
        'suggest.follow',
        'discover.content',
        'personalize.feed',
        'monetize.ideas',
        'audience.insights',
        'content.optimize',
        'forecast.revenue',
        'optimize.inventory',
        'predict.churn',
      ],
    };

    const allowedCapabilities = capabilityMap[role] || capabilityMap.user;

    if (!allowedCapabilities.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Action '${action}' not available for role '${role}'` }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Execute AI query (stub - replace with actual AI call via Lovable AI or OpenAI)
    const mockResponses: Record<string, string> = {
      'suggest.follow': 'Follow @creator123 for tech tips',
      'discover.content': 'Trending: Top 10 startup tools',
      'personalize.feed': 'Your feed is now optimized for tech and startups',
      'monetize.ideas': 'Launch a $9.99/mo premium tier',
      'audience.insights': 'Your top followers are in tech (45%)',
      'content.optimize': 'Post at 9 AM for max engagement',
      'forecast.revenue': 'Forecasted revenue: $15,000 next 30 days',
      'optimize.inventory': 'Stock up on Product Y - trending +30%',
      'predict.churn': 'High churn risk: 5 customers this week',
    };

    const suggestion = mockResponses[action] || 'No suggestion available';

    return new Response(
      JSON.stringify({
        suggestion,
        confidence: 0.85,
        source: `${role}-tier`,
        tokensUsed: role === 'business' ? 1000 : role === 'creator' ? 500 : 100,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Yalls AI query error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
