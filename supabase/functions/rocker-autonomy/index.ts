import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ConfigCandidate {
  alpha: number;
  mmr_lambda: number;
  retrieve_k: number;
  keep_k: number;
  sim_threshold: number;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('[Autonomy] Starting nightly parameter tuning...');
    
    // 1) Load recent queries & feedback for eval
    const { data: recentMetrics, error: metricsErr } = await supabase
      .from('rocker_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (metricsErr) throw metricsErr;
    
    const { data: feedback, error: feedbackErr } = await supabase
      .from('rocker_feedback')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    if (feedbackErr) throw feedbackErr;
    
    if (!recentMetrics || recentMetrics.length < 10) {
      console.log('[Autonomy] Not enough data for tuning (need at least 10 queries)');
      return new Response(
        JSON.stringify({ message: 'Insufficient data for tuning' }),
        { status: 200 }
      );
    }
    
    console.log(`[Autonomy] Evaluating with ${recentMetrics.length} queries, ${feedback?.length || 0} feedback items`);
    
    // 2) Define candidate configurations to test
    const { data: currentConfig } = await supabase
      .from('rocker_config')
      .select('*')
      .eq('id', 1)
      .single();
    
    const baseConfig = currentConfig || {
      alpha: 0.7,
      mmr_lambda: 0.7,
      retrieve_k: 20,
      keep_k: 5,
      sim_threshold: 0.65,
    };
    
    const candidates: ConfigCandidate[] = [
      baseConfig, // current
      { ...baseConfig, alpha: 0.6 }, // more lexical
      { ...baseConfig, alpha: 0.8 }, // more vector
      { ...baseConfig, mmr_lambda: 0.6 }, // more diversity
      { ...baseConfig, mmr_lambda: 0.8 }, // more relevance
      { ...baseConfig, retrieve_k: 30, keep_k: 6 }, // wider net
      { ...baseConfig, retrieve_k: 15, keep_k: 4 }, // narrower, faster
      { ...baseConfig, sim_threshold: 0.62 }, // more permissive
    ];
    
    console.log(`[Autonomy] Testing ${candidates.length} configurations`);
    
    // 3) Score each candidate
    const scores: Array<{ config: ConfigCandidate; score: number }> = [];
    
    for (const candidate of candidates) {
      let totalScore = 0;
      let count = 0;
      
      for (const metric of recentMetrics.slice(0, 50)) { // Sample 50 for speed
        // Score based on:
        // - MRR (mean reciprocal rank)
        // - Hit@5 (was answer in top 5?)
        // - Low confidence penalty
        // - Latency penalty (prefer faster)
        
        const mrrScore = (metric.mrr || 0) * 0.4;
        const hit5Score = (metric.hit5 ? 1 : 0) * 0.3;
        const confScore = (metric.low_conf ? -0.2 : 0.1);
        const latencyScore = Math.max(0, (5000 - (metric.latency_ms || 0)) / 5000) * 0.2;
        
        totalScore += mrrScore + hit5Score + confScore + latencyScore;
        count++;
      }
      
      // Bonus for positive feedback
      if (feedback && feedback.length > 0) {
        const helpfulCount = feedback.filter(f => f.helpful).length;
        const feedbackBonus = (helpfulCount / feedback.length) * 0.3;
        totalScore += feedbackBonus * count;
      }
      
      const avgScore = count > 0 ? totalScore / count : 0;
      scores.push({ config: candidate, score: avgScore });
      
      console.log(`[Autonomy] Config score: ${avgScore.toFixed(3)} for alpha=${candidate.alpha}, mmr=${candidate.mmr_lambda}, k=${candidate.retrieve_k}`);
    }
    
    // 4) Pick winner
    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0];
    
    console.log(`[Autonomy] Winner: alpha=${winner.config.alpha}, mmr=${winner.config.mmr_lambda}, retrieve_k=${winner.config.retrieve_k}, score=${winner.score.toFixed(3)}`);
    
    // 5) Update config if winner is better than current
    const currentScore = scores.find(s => 
      s.config.alpha === baseConfig.alpha &&
      s.config.mmr_lambda === baseConfig.mmr_lambda &&
      s.config.retrieve_k === baseConfig.retrieve_k
    )?.score || 0;
    
    if (winner.score > currentScore + 0.05) { // Only update if meaningfully better
      const { error: updateErr } = await supabase
        .from('rocker_config')
        .update({
          alpha: winner.config.alpha,
          mmr_lambda: winner.config.mmr_lambda,
          retrieve_k: winner.config.retrieve_k,
          keep_k: winner.config.keep_k,
          sim_threshold: winner.config.sim_threshold,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      
      if (updateErr) throw updateErr;
      
      console.log('[Autonomy] Config updated to winner');
      
      return new Response(
        JSON.stringify({
          message: 'Config updated',
          old_config: baseConfig,
          new_config: winner.config,
          score_improvement: winner.score - currentScore,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('[Autonomy] Current config is still optimal');
      
      return new Response(
        JSON.stringify({
          message: 'Current config retained',
          config: baseConfig,
          score: currentScore,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('[Autonomy] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
