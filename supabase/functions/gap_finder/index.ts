/**
 * Gap Finder Sub-Agent
 * Analyzes system for missing features, bottlenecks, and opportunities
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withTenantGuard, type TenantContext } from "../_shared/tenantGuard.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { kernel } from "../_shared/dynamic-kernel.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger('gap_finder');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  return withTenantGuard(req, async (ctx: TenantContext) => {
    try {
      const { scope } = await req.json() as { scope?: 'user' | 'org' | 'platform' };

      log.info('Gap finder analyzing', { scope: scope || 'user', userId: ctx.userId });

      // Gather evidence from multiple sources
      const evidence: Record<string, any> = {};

      // 1. Low-confidence AI responses
      const { data: lowConfResponses } = await ctx.tenantClient
        .from('rocker_gap_signals')
        .select('*')
        .eq('user_id', ctx.userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('score', { ascending: true })
        .limit(10);

      evidence.low_conf_count = lowConfResponses?.length || 0;
      evidence.low_conf_queries = lowConfResponses?.map(r => r.query) || [];

      // 2. Incomplete data (profiles, calendars, etc.)
      const { data: profile } = await ctx.tenantClient
        .from('profiles')
        .select('display_name, bio, avatar_url')
        .eq('user_id', ctx.userId)
        .single();

      evidence.profile_incomplete = !profile?.display_name || !profile?.bio;

      // 3. Failed actions or errors
      const { data: errors } = await ctx.tenantClient
        .from('ai_action_ledger')
        .select('action, result')
        .eq('user_id', ctx.userId)
        .eq('result', 'error')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10);

      evidence.error_count = errors?.length || 0;
      evidence.failed_actions = errors?.map(e => e.action) || [];

      // 4. Use AI to analyze gaps
      const analysis = await kernel.chat(
        ctx,
        [
          {
            role: 'system',
            content: `You are a gap detection AI. Analyze evidence and identify:
              - Missing features users need
              - Bottlenecks in workflows
              - Opportunities for improvement
              Output as JSON with: gaps[], questions[], proposed_plan`
          },
          {
            role: 'user',
            content: `Evidence:\n${JSON.stringify(evidence, null, 2)}\n\nWhat gaps do you see?`
          }
        ],
        { 
          temperature: 0.4,
          latency: 'interactive',
          tools: [{
            name: 'report_gaps',
            description: 'Report identified gaps',
            parameters: {
              type: 'object',
              properties: {
                gaps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      desc: { type: 'string' },
                      impact: { type: 'number' },
                      urgency: { type: 'number' },
                      evidence: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                questions: { type: 'array', items: { type: 'string' } },
                proposed_plan: {
                  type: 'object',
                  properties: {
                    steps: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          action: { type: 'string' },
                          why: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }]
        }
      );

      log.info('Gap analysis complete');

      // Parse AI response (assuming tool call or JSON in text)
      let result: any = { gaps: [], questions: [], proposed_plan: { steps: [] } };
      
      try {
        if (analysis.raw?.choices?.[0]?.message?.tool_calls?.[0]) {
          result = JSON.parse(analysis.raw.choices[0].message.tool_calls[0].function.arguments);
        } else if (analysis.text) {
          const jsonMatch = analysis.text.match(/```json\n([\s\S]+?)\n```/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[1]);
          }
        }
      } catch (e) {
        log.error('Failed to parse gaps', e);
      }

      // Store for Super Andy to review
      if (result.gaps.length > 0) {
        await ctx.tenantClient.from('ai_proposals').insert({
          type: 'gap_found',
          user_id: ctx.userId,
          payload: result,
          due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      log.error('Gap finder failed', error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }, { requireAuth: true, rateLimitTier: 'high' });
});
