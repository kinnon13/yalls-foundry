/**
 * Role: Section AI Hook - Gated AI capabilities with toast feedback
 * Path: src/lib/shared/hooks/useSectionAI.ts
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/lib/auth/context';
import { getCapabilities, hasCapability, executeQuery, getMinRole } from '@/lib/ai/tiered-kernel';
import type { Role } from '@/apps/types';

export interface AIAction {
  id: string;
  action: string;
  description: string;
}

export function useSectionAI() {
  const { toast } = useToast();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get user role (default to 'user' if authenticated, 'anonymous' if not)
  const userRole: Role = session?.userId 
    ? ((session as any).role || 'user') as Role
    : 'anonymous';

  // Get available capabilities for current role
  const capabilities = getCapabilities(userRole);

  /**
   * Execute an AI capability with gating
   */
  const execute = useCallback(async (
    capabilityId: string,
    context: Record<string, any> = {}
  ): Promise<{ result?: string; error?: string }> => {
    // Check if user has access
    if (!hasCapability(userRole, capabilityId)) {
      const minRole = getMinRole(capabilityId);
      const upgradeMessage = minRole === 'admin' 
        ? 'Upgrade to Creator/Business role for this feature'
        : `Requires ${minRole} role`;
      
      toast({
        title: 'Feature Locked',
        description: upgradeMessage,
        variant: 'destructive',
      });
      
      return { error: '403 Forbidden' };
    }

    setIsLoading(true);
    
    try {
      const capability = capabilities.find(c => c.id === capabilityId);
      if (!capability) {
        throw new Error('Capability not found');
      }

      const result = await executeQuery(capability.action, context);
      
      if (result.error) {
        toast({
          title: 'AI Error',
          description: result.error,
          variant: 'destructive',
        });
        return { error: result.error };
      }

      return { result: result.result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI request failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userRole, capabilities, toast]);

  /**
   * Show AI nudge with suggestion
   */
  const showNudge = useCallback((suggestion: string) => {
    toast({
      title: 'AI Suggestion',
      description: suggestion,
    });
  }, [toast]);

  return {
    capabilities,
    userRole,
    isLoading,
    execute,
    showNudge,
    hasCapability: (capId: string) => hasCapability(userRole, capId),
  };
}
