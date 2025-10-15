/**
 * Pattern aggregation and analytics calculation
 * Runs in background to analyze user behavior trends
 */

export async function aggregatePatternsAndAnalytics(
  supabaseClient: any,
  userId: string
) {
  try {
    // Aggregate common patterns across users
    const { data: userMemories } = await supabaseClient
      .from('ai_user_memory')
      .select('type, key, confidence')
      .eq('user_id', userId);

    if (!userMemories || userMemories.length === 0) return;

    // Group by type and calculate frequencies
    const patternCounts: Record<string, number> = {};
    userMemories.forEach((m: any) => {
      const patternKey = `${m.type}_${m.key.substring(0, 30)}`;
      patternCounts[patternKey] = (patternCounts[patternKey] || 0) + 1;
    });

    // Update global patterns table
    for (const [patternKey, count] of Object.entries(patternCounts)) {
      await supabaseClient
        .from('ai_global_patterns')
        .upsert({
          pattern_key: patternKey,
          pattern_type: patternKey.split('_')[0],
          occurrence_count: count,
          user_count: 1,
          last_observed_at: new Date().toISOString()
        }, { 
          onConflict: 'pattern_key',
          ignoreDuplicates: false 
        });
    }

    // Calculate user analytics
    const totalMemories = userMemories.length;
    const avgConfidence = userMemories.reduce((sum: number, m: any) => 
      sum + (m.confidence || 0), 0) / totalMemories;

    await supabaseClient
      .from('ai_user_analytics')
      .insert({
        user_id: userId,
        metric_type: 'memory_count',
        metric_value: totalMemories,
        metadata: { avg_confidence: avgConfidence }
      });

    console.log(`[Analytics] Aggregated patterns for user ${userId}`);
  } catch (error) {
    console.error('[Analytics] Failed:', error);
  }
}
