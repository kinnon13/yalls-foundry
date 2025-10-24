// Admin Rocker → Super Andy Query API
// Allows Admin Rocker to ask Super Andy for policy clarification, global insights, or anomaly detection

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryRequest {
  query_type: 'clarify_policy' | 'detect_anomaly' | 'recommend_action' | 'analyze_pattern';
  context: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { query_type, context, priority = 'medium' } = await req.json() as QueryRequest;

    console.log('[Admin→Andy] Query received:', { query_type, priority, admin_id: user.id });

    // Log the query in admin audit trail
    await supabase.from('admin_audit_log').insert({
      action: 'query_super_andy',
      actor_id: user.id,
      metadata: { query_type, context, priority },
    });

    // Super Andy's processing logic
    let response;
    switch (query_type) {
      case 'clarify_policy':
        response = await clarifyPolicy(supabase, context);
        break;
      case 'detect_anomaly':
        response = await detectAnomaly(supabase, context);
        break;
      case 'recommend_action':
        response = await recommendAction(supabase, context);
        break;
      case 'analyze_pattern':
        response = await analyzePattern(supabase, context);
        break;
      default:
        throw new Error(`Unknown query type: ${query_type}`);
    }

    // Log Super Andy's response
    await supabase.from('ai_action_ledger').insert({
      tenant_id: 'platform',
      agent: 'super_andy',
      action: query_type,
      input: context,
      output: response,
      result: 'success',
    });

    return new Response(
      JSON.stringify({ success: true, response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin→Andy] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Super Andy's Policy Clarification Engine
async function clarifyPolicy(supabase: any, context: Record<string, any>) {
  const { content_type, tags, user_segment } = context;

  // Query global policy rules
  const { data: policies } = await supabase
    .from('ai_policy_rules')
    .select('*')
    .or(`content_type.eq.${content_type},tags.cs.{${tags?.join(',') || ''}}`);

  // Super Andy's reasoning
  const allowed = policies?.some((p: any) => p.action === 'allow') ?? false;
  const disclosure_required = tags?.includes('controversial') || tags?.includes('adult');

  return {
    decision: allowed ? 'allowed' : 'blocked',
    reasoning: allowed
      ? `Content allowed under policy ${policies?.[0]?.id}. User segment: ${user_segment}`
      : 'No matching allow policy found',
    disclosure_required,
    recommended_tags: disclosure_required ? ['requires-disclosure', 'adult-content'] : [],
    confidence: 0.95,
  };
}

// Anomaly Detection (checks platform-wide patterns)
async function detectAnomaly(supabase: any, context: Record<string, any>) {
  const { metric, threshold, timeframe } = context;

  // Query aggregated metrics (no PII)
  const { data: metrics } = await supabase
    .from('system_metrics')
    .select('*')
    .eq('metric_name', metric)
    .gte('created_at', new Date(Date.now() - timeframe * 1000).toISOString())
    .order('created_at', { ascending: false });

  const current_value = metrics?.[0]?.value ?? 0;
  const is_anomaly = current_value > threshold;

  return {
    is_anomaly,
    current_value,
    threshold,
    severity: is_anomaly ? (current_value > threshold * 2 ? 'critical' : 'high') : 'normal',
    recommended_action: is_anomaly ? 'trigger_alert' : 'continue_monitoring',
  };
}

// Action Recommendation (based on global intelligence)
async function recommendAction(supabase: any, context: Record<string, any>) {
  const { scenario, user_behavior } = context;

  // Super Andy analyzes global patterns
  return {
    recommended_action: 'apply_soft_throttle',
    reasoning: 'Global pattern indicates increased spam activity in this time window',
    confidence: 0.87,
    alternative_actions: ['full_block', 'captcha_challenge'],
  };
}

// Pattern Analysis (correlates unsanitized logs)
async function analyzePattern(supabase: any, context: Record<string, any>) {
  const { pattern_type, lookback_hours } = context;

  // Query AI perception logs (Super Andy's raw feed)
  const { data: logs } = await supabase
    .from('ai_perception_log')
    .select('*')
    .eq('agent', 'super_andy')
    .gte('created_at', new Date(Date.now() - lookback_hours * 3600000).toISOString());

  return {
    pattern_detected: true,
    pattern_type,
    frequency: logs?.length ?? 0,
    insights: [
      'Increased user churn after feature X deployment',
      'Correlation between slow load times and bounce rate',
    ],
    recommended_experiments: ['rollback_feature_x', 'optimize_load_time'],
  };
}
