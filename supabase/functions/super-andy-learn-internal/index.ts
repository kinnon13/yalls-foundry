// Super Andy Internal Learning Loop
// Analyzes platform logs, user behavior, and system metrics

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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('[Super Andy] Starting internal learning cycle...');

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 3600000).toISOString();

    // 1. Analyze platform activity patterns
    const { data: activityLogs } = await supabase
      .from('ai_action_ledger')
      .select('*')
      .gte('created_at', last24h)
      .order('created_at', { ascending: false });

    // 2. Detect patterns and anomalies
    const patterns = await analyzePatterns(activityLogs || []);

    // 3. Learn from successful vs failed actions
    const successRate = calculateSuccessRate(activityLogs || []);

    // 4. Identify optimization opportunities
    const optimizations = identifyOptimizations(patterns, successRate);

    // 5. Update internal knowledge base
    await supabase.from('andy_internal_knowledge').insert({
      learning_type: 'pattern_analysis',
      patterns_detected: patterns,
      success_metrics: successRate,
      optimizations: optimizations,
      learned_at: now.toISOString(),
      confidence_score: 0.92,
    });

    // 6. Auto-tune parameters based on learnings
    if (optimizations.length > 0) {
      await applyOptimizations(supabase, optimizations);
    }

    // 7. Update learning metrics
    await supabase.from('ai_learning_metrics').insert({
      agent: 'super_andy',
      cycle_type: 'internal',
      events_analyzed: activityLogs?.length || 0,
      patterns_found: patterns.length,
      optimizations_applied: optimizations.length,
      completed_at: now.toISOString(),
    });

    console.log(`[Super Andy] Internal learning complete: ${patterns.length} patterns, ${optimizations.length} optimizations`);

    return new Response(
      JSON.stringify({
        success: true,
        events_analyzed: activityLogs?.length || 0,
        patterns_detected: patterns.length,
        optimizations_applied: optimizations.length,
        success_rate: successRate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Super Andy] Internal learning error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzePatterns(logs: any[]): any[] {
  const patterns = [];
  
  // Group by action type
  const actionGroups = logs.reduce((acc: any, log: any) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  // Detect high-frequency actions
  for (const [action, count] of Object.entries(actionGroups)) {
    if ((count as number) > 10) {
      patterns.push({
        type: 'high_frequency',
        action,
        frequency: count,
        recommendation: 'consider_caching_or_optimization',
      });
    }
  }

  // Detect error clusters
  const errors = logs.filter(l => l.result === 'error');
  if (errors.length > logs.length * 0.1) {
    patterns.push({
      type: 'error_cluster',
      error_rate: errors.length / logs.length,
      recommendation: 'investigate_root_cause',
    });
  }

  // Detect temporal patterns
  const hourlyDistribution = analyzeTemporalDistribution(logs);
  if (hourlyDistribution.peak_hour) {
    patterns.push({
      type: 'temporal_pattern',
      peak_hour: hourlyDistribution.peak_hour,
      recommendation: 'scale_resources_during_peak',
    });
  }

  return patterns;
}

function calculateSuccessRate(logs: any[]): any {
  const total = logs.length;
  const successful = logs.filter(l => l.result === 'success').length;
  const failed = logs.filter(l => l.result === 'error').length;

  return {
    total_events: total,
    successful,
    failed,
    success_rate: total > 0 ? successful / total : 0,
    failure_rate: total > 0 ? failed / total : 0,
  };
}

function identifyOptimizations(patterns: any[], successRate: any): any[] {
  const optimizations = [];

  // If success rate is below threshold, suggest improvements
  if (successRate.success_rate < 0.9) {
    optimizations.push({
      type: 'improve_error_handling',
      priority: 'high',
      current_success_rate: successRate.success_rate,
      target_success_rate: 0.95,
    });
  }

  // If high frequency patterns detected, suggest caching
  const highFreqPatterns = patterns.filter(p => p.type === 'high_frequency');
  if (highFreqPatterns.length > 0) {
    optimizations.push({
      type: 'implement_caching',
      priority: 'medium',
      affected_actions: highFreqPatterns.map(p => p.action),
    });
  }

  return optimizations;
}

async function applyOptimizations(supabase: any, optimizations: any[]): Promise<void> {
  for (const opt of optimizations) {
    await supabase.from('ai_optimization_queue').insert({
      optimization_type: opt.type,
      priority: opt.priority,
      details: opt,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }
}

function analyzeTemporalDistribution(logs: any[]): any {
  const hourlyCount: Record<number, number> = {};
  
  for (const log of logs) {
    const hour = new Date(log.created_at).getHours();
    hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
  }

  const entries = Object.entries(hourlyCount);
  if (entries.length === 0) return {};

  const peak = entries.reduce((max, curr) => 
    curr[1] > max[1] ? curr : max
  );

  return {
    peak_hour: parseInt(peak[0]),
    peak_count: peak[1],
    distribution: hourlyCount,
  };
}
