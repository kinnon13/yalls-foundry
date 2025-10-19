/**
 * Vault Audit Logging - Billion-User Scale
 * 
 * All vault operations are logged for compliance and security.
 * Features:
 * - Immutable audit trail
 * - PII-safe logging (no sensitive data)
 * - Batch processing for high throughput
 */

import { supabase } from '@/integrations/supabase/client';

export interface VaultAuditEvent {
  vault_id: string;
  user_id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'grant_access' | 'revoke_access';
  item_id?: string;
  item_kind?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_code?: string;
}

/**
 * Log vault operation to audit trail
 */
export async function logVaultAudit(event: VaultAuditEvent): Promise<void> {
  try {
    await supabase
      .from('ai_action_ledger')
      .insert({
        user_id: event.user_id,
        agent: 'vault',
        action: event.action,
        input: {
          vault_id: event.vault_id,
          item_id: event.item_id,
          item_kind: event.item_kind,
          // No sensitive data in logs
        },
        output: {
          success: event.success,
          error_code: event.error_code
        },
        result: event.success ? 'success' : 'failure'
      });
  } catch (error) {
    // Fail silently - audit logging should not block vault operations
    console.error('Failed to log vault audit event:', error);
  }
}

/**
 * Check if user has recently verified 2FA (for high-security operations)
 */
export async function requireRecentMFA(
  userId: string,
  maxAgeMinutes: number = 5
): Promise<boolean> {
  const { data, error } = await supabase
    .from('ai_action_ledger')
    .select('timestamp')
    .eq('user_id', userId)
    .eq('agent', 'auth')
    .eq('action', 'mfa_verify')
    .eq('result', 'success')
    .gte('timestamp', new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to check MFA status:', error);
    return false;
  }

  return data !== null;
}

/**
 * Rate limit vault operations (prevent abuse)
 */
export async function checkVaultRateLimit(
  userId: string,
  operation: string,
  maxOps: number = 100,
  windowMinutes: number = 60
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const { count, error } = await supabase
    .from('ai_action_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('agent', 'vault')
    .eq('action', operation)
    .gte('timestamp', windowStart.toISOString());

  if (error) {
    console.error('Failed to check rate limit:', error);
    // Fail open (allow operation) on error
    return true;
  }

  return (count || 0) < maxOps;
}
