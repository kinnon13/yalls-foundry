/**
 * Admin Command Handler
 * Processes fast-lane admin commands
 */

import { supabase } from '@/integrations/supabase/client';

interface AdminCommand {
  order: string;
  args?: Record<string, any>;
  userId: string;
}

/**
 * Execute admin command by calling control API
 */
async function executeControlAction(path: string, body: any, userId: string): Promise<void> {
  try {
    // In production, this would call the ai_control edge function
    // For now, directly update the database
    console.log(`[Admin] Executing ${path}:`, body);

    if (path === '/global') {
      await (supabase as any)
        .from('ai_control_flags')
        .update({
          ...body,
          last_changed_by: userId,
          changed_at: new Date().toISOString(),
        });
    } else if (path === '/scope') {
      await (supabase as any)
        .from('ai_control_scopes')
        .upsert({
          scope_type: body.type,
          scope_key: body.key,
          paused: body.paused,
          reason: body.reason || 'Admin command',
          changed_by: userId,
          changed_at: new Date().toISOString(),
        }, {
          onConflict: 'scope_type,scope_key',
        });
    }

    // Log to kill events
    await (supabase as any)
      .from('ai_kill_events')
      .insert({
        level: path === '/global' ? 'global' : body.type,
        key: body.key || null,
        action: JSON.stringify(body),
        requested_by: userId,
        reason: body.reason || 'Admin command',
      });
  } catch (error) {
    console.error('[Admin] Error executing control action:', error);
    throw error;
  }
}

/**
 * Parse and execute admin command
 */
export default async function adminCommand(payload: AdminCommand, eventId: string): Promise<void> {
  const text = (payload.order || '').toLowerCase().trim();
  const userId = payload.userId;

  console.log(`[Admin] Command: "${text}"`);

  try {
    // Global controls
    if (text === 'pause all' || text === 'stop all') {
      await executeControlAction('/global', { global_pause: true, last_reason: text }, userId);
      return;
    }

    if (text === 'resume all' || text === 'start all') {
      await executeControlAction('/global', { global_pause: false, last_reason: text }, userId);
      return;
    }

    if (text === 'burst on' || text === 'enable burst') {
      await executeControlAction('/global', { burst_override: true, last_reason: text }, userId);
      return;
    }

    if (text === 'burst off' || text === 'disable burst') {
      await executeControlAction('/global', { burst_override: false, last_reason: text }, userId);
      return;
    }

    if (text === 'read only on' || text === 'freeze writes') {
      await executeControlAction('/global', { write_freeze: true, last_reason: text }, userId);
      return;
    }

    if (text === 'read only off' || text === 'unfreeze writes') {
      await executeControlAction('/global', { write_freeze: false, last_reason: text }, userId);
      return;
    }

    // Scope controls
    const pausePoolMatch = text.match(/pause pool (\w+)/);
    if (pausePoolMatch) {
      const poolName = pausePoolMatch[1];
      await executeControlAction('/scope', {
        type: 'pool',
        key: poolName,
        paused: true,
        reason: text,
      }, userId);
      return;
    }

    const resumePoolMatch = text.match(/resume pool (\w+)/);
    if (resumePoolMatch) {
      const poolName = resumePoolMatch[1];
      await executeControlAction('/scope', {
        type: 'pool',
        key: poolName,
        paused: false,
        reason: text,
      }, userId);
      return;
    }

    const quarantineTenantMatch = text.match(/quarantine tenant ([a-f0-9-]+)/);
    if (quarantineTenantMatch) {
      const tenantId = quarantineTenantMatch[1];
      await executeControlAction('/scope', {
        type: 'tenant',
        key: tenantId,
        paused: true,
        reason: text,
      }, userId);
      return;
    }

    const unquarantineTenantMatch = text.match(/unquarantine tenant ([a-f0-9-]+)/);
    if (unquarantineTenantMatch) {
      const tenantId = unquarantineTenantMatch[1];
      await executeControlAction('/scope', {
        type: 'tenant',
        key: tenantId,
        paused: false,
        reason: text,
      }, userId);
      return;
    }

    console.warn(`[Admin] Unknown command: "${text}"`);
  } catch (error) {
    console.error('[Admin] Command execution failed:', error);
    throw error;
  }
}
