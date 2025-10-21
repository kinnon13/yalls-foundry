import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { createLogger } from "../_shared/logger.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * Proactive 30-min Job
 * Runs autonomous analysis and suggestion generation every 30 minutes
 */
serve(async (req) => {
  const log = createLogger('rocker-proactive-30min');
  log.startTimer();

  try {
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // Get all active users with consent
    const { data: users, error: usersErr } = await sb
      .from('learning_consent')
      .select('user_id')
      .eq('consent_given', true);

    if (usersErr) throw usersErr;

    log.info(`[Proactive] Processing ${users?.length || 0} users`);

    let processedCount = 0;
    let insightsGenerated = 0;

    for (const userConsent of users || []) {
      try {
        // Run insights extraction for each user
        const { data: insightData, error: insightErr } = await sb.functions.invoke('rocker-insights', {
          body: { lookback: 3 } // Last 3 days
        });

        if (insightErr) {
          log.error(`[Proactive] Failed for user ${userConsent.user_id}`, insightErr);
          continue;
        }

        // Check if insights have high-priority items
        const insights = insightData?.insights || [];
        const highPriority = insights.filter((i: any) => i.priority === 'high');

        if (highPriority.length > 0) {
          // Create proactive notification/suggestion
          await sb.from('rocker_notifications').insert({
            user_id: userConsent.user_id,
            type: 'insight',
            title: `${highPriority.length} high-priority insight${highPriority.length > 1 ? 's' : ''}`,
            message: highPriority.map((i: any) => i.title).join(', '),
            priority: 'high',
            metadata: {
              insight_ids: highPriority.map((i: any) => i.id),
              source: 'proactive_30min',
              generated_at: new Date().toISOString()
            }
          });

          insightsGenerated += highPriority.length;
        }

        processedCount++;
      } catch (userErr) {
        log.error(`[Proactive] User processing error`, userErr);
      }
    }

    log.info(`[Proactive] Complete - Processed: ${processedCount}, Insights: ${insightsGenerated}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        insights_generated: insightsGenerated,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    log.error('[Proactive] Fatal error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
