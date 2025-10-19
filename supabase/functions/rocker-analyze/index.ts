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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, profileId, action } = await req.json();

    console.log('Rocker analyze request:', { userId, profileId, action });

    if (action === 'generate_suggestions') {
      // Analyze user activity patterns
      const { data: recentActivity } = await supabase
        .from('ai_action_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      // Analyze KPIs if profile provided
      let kpiAnalysis = null;
      if (profileId) {
        // Check for business metrics decline
        const { data: metrics } = await supabase
          .from('commission_ledger')
          .select('*')
          .eq('entity_id', profileId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        kpiAnalysis = metrics;
      }

      // Generate intelligent suggestions based on patterns
      const suggestions = [];

      // Suggestion 1: Activity-based
      if (recentActivity && recentActivity.length < 10) {
        suggestions.push({
          user_id: userId,
          profile_id: profileId,
          suggestion_type: 'engagement',
          title: 'Increase Your Activity',
          description: 'Your activity has been low recently. Consider posting updates or engaging with your network to boost visibility.',
          priority: 'medium',
          confidence: 0.85,
          action_data: {
            recommended_action: 'create_post',
            target_frequency: '3_per_week'
          }
        });
      }

      // Suggestion 2: MLM network growth
      if (profileId) {
        const { data: networkSize } = await supabase
          .from('affiliate_subscriptions')
          .select('id')
          .eq('referrer_user_id', userId);

        if (networkSize && networkSize.length < 5) {
          suggestions.push({
            user_id: userId,
            profile_id: profileId,
            suggestion_type: 'network_growth',
            title: 'Expand Your Network',
            description: 'Your network is small. Share your referral link to grow your earning potential.',
            priority: 'high',
            confidence: 0.9,
            action_data: {
              recommended_action: 'share_referral',
              current_size: networkSize?.length || 0,
              target_size: 10
            }
          });
        }
      }

      // Suggestion 3: KPI-based
      if (kpiAnalysis && kpiAnalysis.length > 0) {
        const totalEarnings = kpiAnalysis.reduce((sum: number, item: any) => sum + (item.amount_cents || 0), 0);
        if (totalEarnings < 10000) { // Less than $100 in 30 days
          suggestions.push({
            user_id: userId,
            profile_id: profileId,
            suggestion_type: 'revenue_optimization',
            title: 'Boost Your Revenue',
            description: 'Your earnings are below average. Consider promoting your top-performing products more actively.',
            priority: 'high',
            confidence: 0.88,
            action_data: {
              recommended_action: 'increase_promotion',
              current_revenue: totalEarnings,
              target_revenue: 50000
            }
          });
        }
      }

      // Insert suggestions into database
      if (suggestions.length > 0) {
        const { error: insertError } = await supabase
          .from('rocker_suggestions')
          .insert(suggestions);

        if (insertError) {
          console.error('Error inserting suggestions:', insertError);
          throw insertError;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          suggestions_generated: suggestions.length,
          message: `Generated ${suggestions.length} new suggestions`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error) {
    console.error('Error in rocker-analyze:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
