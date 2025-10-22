/**
 * Approval Flow for Andy + User Preferences
 * 
 * Ensures that:
 * - Users with approval_mode='ask' get confirmation prompts
 * - Agent Super Andy respects user preferences
 * - All approvals are logged
 */

import { supabase } from '@/integrations/supabase/client';

export type ApprovalMode = 'ask' | 'auto' | 'never';

export interface ApprovalRequest {
  actionSummary: string;
  actionType: 'write' | 'delete' | 'execute' | 'post';
  context?: Record<string, any>;
}

export interface ApprovalResult {
  approved: boolean;
  reason?: string;
  timestamp: number;
}

/**
 * Check if action requires approval based on user preferences
 */
export async function requiresApproval(userId: string): Promise<ApprovalMode> {
  try {
    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select('approval_mode')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('[Approval] Could not fetch user preferences:', error);
      return 'ask'; // Default to safe mode
    }

    return (data?.approval_mode as ApprovalMode) || 'ask';
  } catch (err) {
    console.error('[Approval] Error checking approval mode:', err);
    return 'ask';
  }
}

/**
 * Request approval from user via modal/dialog
 */
export async function requestApproval(
  request: ApprovalRequest
): Promise<ApprovalResult> {
  return new Promise((resolve) => {
    // Dispatch custom event for UI to handle
    const event = new CustomEvent('approval:request', {
      detail: {
        request,
        onApprove: () => {
          resolve({
            approved: true,
            timestamp: Date.now(),
          });
        },
        onReject: (reason?: string) => {
          resolve({
            approved: false,
            reason: reason || 'User rejected',
            timestamp: Date.now(),
          });
        },
      },
    });

    window.dispatchEvent(event);

    // Timeout after 60 seconds
    setTimeout(() => {
      resolve({
        approved: false,
        reason: 'Approval timeout',
        timestamp: Date.now(),
      });
    }, 60000);
  });
}

/**
 * Execute action with approval flow
 */
export async function maybeRunWithApproval<T>(
  userId: string,
  request: ApprovalRequest,
  action: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  try {
    const mode = await requiresApproval(userId);

    if (mode === 'never') {
      return {
        success: false,
        error: 'Your preferences require approval. Please update settings to enable actions.',
      };
    }

    if (mode === 'ask') {
      const approval = await requestApproval(request);
      
      if (!approval.approved) {
        return {
          success: false,
          error: approval.reason || 'Action not approved',
        };
      }
    }

    // Mode is 'auto' or approval granted
    const result = await action();

    // Log action
    await supabase.from('ai_action_ledger').insert({
      tenant_id: null, // Set from context
      user_id: userId,
      topic: `action.${request.actionType}`,
      payload: {
        summary: request.actionSummary,
        context: request.context,
        approvalMode: mode,
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error('[Approval] Action execution error:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}
