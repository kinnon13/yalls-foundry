/**
 * Control Flags Loader
 * Loads global and scoped control flags for worker obedience
 */

import { supabase } from '@/integrations/supabase/client';

export interface ControlFlags {
  globalPause: boolean;
  writeFreeze: boolean;
  externalCalls: boolean;
  burstOverride: boolean;
  lastReason?: string;
  scopes: {
    pool: Set<string>;
    tenant: Set<string>;
    topic: Set<string>;
    region: Set<string>;
  };
}

/**
 * Load current control flags from database
 */
export async function loadFlags(): Promise<ControlFlags> {
  try {
    // Get global flags
    const { data: globalFlags } = await (supabase as any)
      .from('ai_control_flags')
      .select('*')
      .single();

    // Get active scopes
    const { data: scopes } = await (supabase as any)
      .from('ai_control_scopes')
      .select('scope_type, scope_key')
      .eq('paused', true);

    const flags: ControlFlags = {
      globalPause: globalFlags?.global_pause ?? false,
      writeFreeze: globalFlags?.write_freeze ?? false,
      externalCalls: globalFlags?.external_calls_enabled ?? true,
      burstOverride: globalFlags?.burst_override ?? false,
      lastReason: globalFlags?.last_reason,
      scopes: {
        pool: new Set(),
        tenant: new Set(),
        topic: new Set(),
        region: new Set(),
      },
    };

    // Populate scopes
    if (scopes) {
      for (const scope of scopes) {
        const type = scope.scope_type as keyof typeof flags.scopes;
        if (flags.scopes[type]) {
          flags.scopes[type].add(scope.scope_key);
        }
      }
    }

    return flags;
  } catch (error) {
    console.error('[Flags] Error loading control flags:', error);
    // Fail-safe: return permissive flags
    return {
      globalPause: false,
      writeFreeze: false,
      externalCalls: true,
      burstOverride: false,
      scopes: {
        pool: new Set(),
        tenant: new Set(),
        topic: new Set(),
        region: new Set(),
      },
    };
  }
}

/**
 * Check if a job should be skipped based on flags
 */
export function shouldSkipJob(
  flags: ControlFlags,
  job: {
    topic: string;
    tenant_id?: string;
    region?: string;
    mutates?: boolean;
  }
): { skip: boolean; reason?: string } {
  if (flags.globalPause) {
    return { skip: true, reason: 'global_pause' };
  }

  if (flags.writeFreeze && job.mutates) {
    return { skip: true, reason: 'write_freeze' };
  }

  if (job.tenant_id && flags.scopes.tenant.has(job.tenant_id)) {
    return { skip: true, reason: 'tenant_paused' };
  }

  if (flags.scopes.topic.has(job.topic)) {
    return { skip: true, reason: 'topic_paused' };
  }

  if (job.region && flags.scopes.region.has(job.region)) {
    return { skip: true, reason: 'region_paused' };
  }

  return { skip: false };
}

/**
 * Check if a pool should be skipped
 */
export function shouldSkipPool(flags: ControlFlags, poolName: string): boolean {
  return flags.scopes.pool.has(poolName);
}
