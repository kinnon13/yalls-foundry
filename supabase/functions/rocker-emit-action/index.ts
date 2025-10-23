/**
 * Rocker Emit Action Function
 * Backend endpoint for AI to emit actions to the UI via event bus
 * WITH PROPER SECURITY: Rate limiting + tenant isolation + validation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { withTenantGuard, type TenantContext } from '../_shared/tenantGuard.ts';
import { withRateLimit } from '../_shared/withRateLimit.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const log = createLogger('rocker-emit-action');

// Valid action types for validation
const VALID_ACTION_TYPES = [
  'suggest.follow', 'suggest.listing', 'suggest.event', 'suggest.tag',
  'notify.user', 'verify.data', 'update.memory', 'create.proposal'
];

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Wrap in tenant guard for security
  return withTenantGuard(req, async (ctx: TenantContext) => {
    // PROPER rate limiting using existing pattern
    return withRateLimit(
      ctx.tenantClient,
      `emit_action:${ctx.userId}`,
      100, // limit
      3600, // window (1 hour)
      async () => {
        try {
          const { action_type, payload, priority, target_user_id } = await req.json();

          // Validation
          if (!action_type || !payload) {
            return new Response(JSON.stringify({ error: 'Missing action_type or payload' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          if (!VALID_ACTION_TYPES.includes(action_type)) {
            return new Response(JSON.stringify({ error: `Invalid action_type: ${action_type}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          if (priority && !VALID_PRIORITIES.includes(priority)) {
            return new Response(JSON.stringify({ error: `Invalid priority: ${priority}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Payload size check (max 10KB)
          const payloadSize = JSON.stringify(payload).length;
          if (payloadSize > 10240) {
            return new Response(JSON.stringify({ error: 'Payload too large (max 10KB)' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

      // Insert action into ai_proposals (using tenant-isolated client)
      const { error: insertError } = await ctx.tenantClient
        .from('ai_proposals')
        .insert({
          type: action_type,
          user_id: target_user_id || ctx.userId,
          tenant_id: ctx.orgId,
          payload,
          due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      if (insertError) {
        log.error('Failed to insert action', { error: insertError });
        throw insertError;
      }

      // Log to audit trail (using admin client for audit)
      await ctx.adminClient.from('admin_audit_log').insert({
        action: `rocker.action.${action_type}`,
        actor_user_id: ctx.userId,
        metadata: {
          action_type,
          payload,
          priority: priority || 'medium',
          target_user_id: target_user_id || ctx.userId,
          tenant_id: ctx.orgId,
        },
      });

      // Log to AI action ledger for metrics
      await ctx.adminClient.from('ai_action_ledger').insert({
        tenant_id: ctx.orgId,
        user_id: ctx.userId,
        agent: 'rocker',
        action: 'emit_action',
        input: { action_type, priority },
        output: { success: true },
        result: 'success'
      });

      log.info('Action emitted successfully', { 
        action_type, 
        priority: priority || 'medium',
        user_id: ctx.userId,
        org_id: ctx.orgId 
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          action_type, 
          priority: priority || 'medium' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      log.error('Failed to emit action', { error });
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  });
});
