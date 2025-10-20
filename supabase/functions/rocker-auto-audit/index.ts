// Auto-Audit System: Detects features in ingested content and verifies them
// Runs on new file ingestion or can be triggered manually
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log('[rocker-auto-audit] boot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Feature detection patterns
const FEATURE_PATTERNS = {
  rpc: /\b([a-z_]+\([^)]*\))\s*(?:RPC|function|returns)/i,
  table: /\b(?:table|from)\s+([a-z_]+)\b/i,
  route: /(?:route|path|href)["']?\s*[:=]\s*["']([\/\w-]+)["']/i,
  component: /\b([A-Z][a-zA-Z]+(?:Component)?\.tsx?)\b/,
  edge_function: /supabase\.functions\.invoke\(['"]([a-z-]+)['"]/,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const { file_id, content, auto_verify = true } = await req.json();

    const results = {
      file_id,
      features_detected: [] as any[],
      verifications: [] as any[],
      gaps_flagged: 0,
    };

    // Extract features from content
    for (const [type, pattern] of Object.entries(FEATURE_PATTERNS)) {
      const matches = content.matchAll(new RegExp(pattern, 'gi'));
      for (const match of matches) {
        const featureName = match[1];
        if (featureName && featureName.length > 2) {
          results.features_detected.push({
            type,
            name: featureName,
            context: match[0],
          });
        }
      }
    }

    console.log(`[Auto-Audit] Detected ${results.features_detected.length} features in file ${file_id}`);

    // Verify each detected feature
    if (auto_verify && results.features_detected.length > 0) {
      for (const feature of results.features_detected) {
        try {
          const { data: verifyResult, error } = await supabase.functions.invoke('rocker-verify-feature', {
            body: {
              feature_type: feature.type,
              feature_name: feature.name,
              test_connectivity: true,
            },
          });

          if (!error && verifyResult) {
            results.verifications.push({
              ...feature,
              status: verifyResult.status,
              exists: verifyResult.exists,
              accessible: verifyResult.accessible,
            });

            // Flag gaps for not_done or partial features
            if (verifyResult.status !== 'done') {
              results.gaps_flagged++;
              
              // Queue web research for this gap
              await supabase.functions.invoke('rocker-web-research', {
                body: {
                  query: `How to implement ${feature.type}: ${feature.name}`,
                  context: `Feature mentioned but ${verifyResult.status === 'partial' ? 'partially accessible' : 'not found'}`,
                  research_type: 'feature_gap',
                },
              });
            }
          }
        } catch (e) {
          console.error(`[Auto-Audit] Failed to verify ${feature.name}:`, e);
        }
      }
    }

    // Log audit results to ai_action_ledger
    try {
      await supabase.from('ai_action_ledger').insert({
        user_id: null,
        agent: 'rocker_audit',
        action: 'auto_audit',
        input: { file_id, features_detected: results.features_detected.length },
        output: results,
        result: results.gaps_flagged > 0 ? 'partial' : 'success',
      });
    } catch (logErr) {
      console.error('[rocker-auto-audit] Failed to log:', logErr);
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('[rocker-auto-audit] error:', e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
