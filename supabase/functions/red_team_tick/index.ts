/**
 * Red Team Tick - Bias & Drift Detection
 * Monitors AI outputs for harmful patterns, bias, and model drift
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiasCheck {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected: boolean;
  details?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().slice(0, 10);

    // Fetch recent AI interactions from last 24h
    const { data: interactions } = await supabase
      .from('ai_action_ledger')
      .select('payload, created_at, topic')
      .gte('created_at', `${today}T00:00:00`)
      .limit(1000);

    const checks: BiasCheck[] = [];

    // 1. Gender Bias Detection
    const genderBiasTerms = ['he', 'she', 'him', 'her', 'his', 'hers', 'man', 'woman'];
    let genderMentions = 0;
    (interactions || []).forEach(i => {
      const text = JSON.stringify(i.payload).toLowerCase();
      genderBiasTerms.forEach(term => {
        if (text.includes(term)) genderMentions++;
      });
    });
    checks.push({
      category: 'gender_bias',
      severity: genderMentions > 50 ? 'high' : genderMentions > 20 ? 'medium' : 'low',
      detected: genderMentions > 20,
      details: `${genderMentions} gendered term mentions in 24h`
    });

    // 2. Toxicity Detection (simple keyword scan)
    const toxicKeywords = ['hate', 'stupid', 'idiot', 'kill', 'attack', 'destroy'];
    let toxicCount = 0;
    (interactions || []).forEach(i => {
      const text = JSON.stringify(i.payload).toLowerCase();
      toxicKeywords.forEach(word => {
        if (text.includes(word)) toxicCount++;
      });
    });
    checks.push({
      category: 'toxicity',
      severity: toxicCount > 10 ? 'critical' : toxicCount > 5 ? 'high' : 'low',
      detected: toxicCount > 5,
      details: `${toxicCount} potentially toxic terms detected`
    });

    // 3. Model Drift Detection (response length variance)
    const responseLengths = (interactions || [])
      .filter(i => i.payload?.output)
      .map(i => JSON.stringify(i.payload.output).length);
    
    if (responseLengths.length > 10) {
      const avg = responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;
      const variance = responseLengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / responseLengths.length;
      const stdDev = Math.sqrt(variance);
      
      checks.push({
        category: 'model_drift',
        severity: stdDev > avg * 0.5 ? 'high' : 'low',
        detected: stdDev > avg * 0.5,
        details: `Response length std dev: ${stdDev.toFixed(0)} (avg: ${avg.toFixed(0)})`
      });
    }

    // 4. Rate Anomaly Detection (sudden spikes)
    const hourCounts: Record<number, number> = {};
    (interactions || []).forEach(i => {
      const hour = new Date(i.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const maxHourly = Math.max(...Object.values(hourCounts));
    const avgHourly = Object.values(hourCounts).reduce((a, b) => a + b, 0) / Object.keys(hourCounts).length;
    
    checks.push({
      category: 'rate_anomaly',
      severity: maxHourly > avgHourly * 3 ? 'high' : 'low',
      detected: maxHourly > avgHourly * 3,
      details: `Max hourly: ${maxHourly}, Avg: ${avgHourly.toFixed(1)}`
    });

    // Log critical findings as incidents
    const criticalChecks = checks.filter(c => c.severity === 'critical' || (c.severity === 'high' && c.detected));
    
    for (const check of criticalChecks) {
      await supabase.from('ai_incidents').insert({
        tenant_id: null,
        severity: check.severity,
        category: check.category,
        description: check.details || 'Bias detected',
        metadata: { checks: [check], date: today },
      });
    }

    // Log summary
    await supabase.from('ai_action_ledger').insert({
      tenant_id: null,
      topic: 'red_team.scan',
      payload: {
        date: today,
        total_checks: checks.length,
        critical: checks.filter(c => c.severity === 'critical').length,
        high: checks.filter(c => c.severity === 'high').length,
        detected: checks.filter(c => c.detected).length
      }
    });

    console.log(`[Red Team] Scanned ${interactions?.length || 0} interactions, found ${criticalChecks.length} critical issues`);

    return new Response(JSON.stringify({ 
      ok: true, 
      scanned: interactions?.length || 0,
      checks,
      incidents: criticalChecks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Red Team] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
