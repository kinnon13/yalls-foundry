/**
 * Moderate Memory Content
 * 
 * Uses OpenAI via proxy-openai to check memory content for toxicity, abuse, and safety.
 * Returns moderation decision and optionally softened content.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'moderate-memory', RateLimits.expensive);
  if (limited) return limited;

  const log = createLogger('moderate-memory');
  log.startTimer();

  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Use AI gateway for moderation
    const moderationPrompt = `Analyze this user-generated memory/statement for safety and appropriateness.
Check for: hate speech, harassment, threats, sexual content, self-harm, violence, illegal activity.

Content: "${content}"

Respond with:
1. decision: "ok" (safe), "soften" (negative but not abusive), or "block" (abusive/violating)
2. toxicity_score: 0.0 to 1.0 (higher = more toxic)
3. safety_category: main concern category (e.g., "harassment", "hate", "violence", "none")
4. tone: "positive", "neutral", "negative", "hostile"
5. softened_content: if decision is "soften", provide a neutralized version that preserves meaning but removes harsh language
6. reason: brief explanation of the decision`;

    let result: any;
    try {
      const { text } = await ai.chat({
        role: 'admin',
        messages: [
          { role: 'system', content: 'You are a content moderation assistant. Analyze content objectively and provide structured safety assessments.' },
          { role: 'user', content: moderationPrompt }
        ],
        tools: [{
          name: 'moderate_content',
          description: 'Return moderation analysis',
          parameters: {
            type: 'object',
            properties: {
              decision: { type: 'string', enum: ['ok', 'soften', 'block'] },
              toxicity_score: { type: 'number', minimum: 0, maximum: 1 },
              safety_category: { type: 'string' },
              tone: { type: 'string', enum: ['positive', 'neutral', 'negative', 'hostile'] },
              softened_content: { type: 'string' },
              reason: { type: 'string' }
            },
            required: ['decision', 'toxicity_score', 'safety_category', 'tone', 'reason']
          }
        }],
        temperature: 0.3,
        maxTokens: 500
      });
      result = JSON.parse(text);
    } catch (aiError) {
      log.error('AI moderation error', aiError);
      // Fallback basic keyword check
      const lowerContent = content.toLowerCase();
      const hasBlockedWords = [ 'kill', 'die', 'hate', 'fuck', 'bitch', 'attack' ].some(word => lowerContent.includes(word));
      return new Response(
        JSON.stringify({
          decision: hasBlockedWords ? 'soften' : 'ok',
          toxicity_score: hasBlockedWords ? 0.6 : 0.2,
          safety_category: hasBlockedWords ? 'language' : 'none',
          tone: 'neutral',
          reason: 'Fallback moderation',
          original_content: content
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ...result,
        original_content: content
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('Moderation error', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Moderation failed',
        decision: 'ok', // Fail open for user experience
        toxicity_score: 0,
        safety_category: 'error',
        tone: 'neutral',
        reason: 'Error during moderation - defaulting to allow'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
