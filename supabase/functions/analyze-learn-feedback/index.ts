import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'analyze-learn-feedback', RateLimits.standard);
  if (limited) return limited;

  const log = createLogger('analyze-learn-feedback');
  log.startTimer();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { sessionId } = await req.json();

    // Fetch feedback events from telemetry for this session
    const { data: feedbackEvents, error: feedbackError } = await supabase
      .from('rocker_telemetry')
      .select('*')
      .eq('session_id', sessionId)
      .in('event_name', ['learn_feedback', 'learn_session', 'learn_cancelled'])
      .order('created_at', { ascending: true });

    if (feedbackError) throw feedbackError;

    log.info('Found feedback events', { count: feedbackEvents?.length || 0 });

    const learnings: any[] = [];

    for (const event of feedbackEvents || []) {
      const payload = event.payload || {};
      
      if (event.event_name === 'learn_feedback' || payload.outcome === 'feedback') {
        const feedbackText = payload.feedbackText || payload.feedback || '';
        const route = payload.route || '/';
        const target = payload.target || '';
        const attemptedSelector = payload.selector || '';

        // Try to extract a corrected selector or element name
        let correctedTarget = null;
        let analysis = '';

        // Check if feedback mentions a specific element name
        const elementMatch = feedbackText.match(/(?:use|click|select|find)\s+["']?([^"',\.]+)["']?/i);
        if (elementMatch) {
          correctedTarget = elementMatch[1].trim();
          analysis = `User suggested target: "${correctedTarget}"`;
        }

        // Check if feedback describes a workflow issue
        if (/first|then|before|after/i.test(feedbackText)) {
          analysis += ` | Workflow issue: "${feedbackText}"`;
        }

        learnings.push({
          type: 'correction',
          route,
          target,
          attemptedSelector,
          correctedTarget,
          feedback: feedbackText,
          analysis,
          confidence: correctedTarget ? 0.7 : 0.4,
          userId: user.id
        });
      }
    }

    // If we found a clear correction, auto-apply it to selector memory
    const autoApplied = [];
    for (const learning of learnings) {
      if (learning.correctedTarget && learning.confidence >= 0.7) {
        // Try to find the element by the corrected name
        // This would be done client-side, so we'll store it as a suggestion
        const { error: memError } = await supabase
          .from('ai_selector_memory')
          .upsert({
            user_id: user.id,
            route: learning.route,
            target_name: learning.correctedTarget,
            selector: `[data-rocker="${learning.correctedTarget}"]`,
            score: 0.5, // Start with moderate confidence
            successes: 0,
            failures: 0,
            meta: {
              source: 'user_feedback',
              original_target: learning.target,
              feedback: learning.feedback,
              applied_at: new Date().toISOString()
            }
          }, {
            onConflict: 'user_id,route,target_name'
          });

        if (!memError) {
          autoApplied.push(learning.correctedTarget);
          log.info('Auto-applied correction', { target: learning.correctedTarget });
        }
      }
    }

    return new Response(
      JSON.stringify({
        learnings,
        autoApplied,
        message: autoApplied.length > 0 
          ? `Applied ${autoApplied.length} correction(s) to memory` 
          : 'Feedback analyzed but no clear corrections found'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('Feedback analysis error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
