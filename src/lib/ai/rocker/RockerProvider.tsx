/**
 * Rocker Provider - Unified Context for AI Observability
 * Provides section-level AI integration across all 10 sections
 */

import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';

type Section =
  | 'discovery'
  | 'marketplace'
  | 'profiles'
  | 'equinestats'
  | 'events'
  | 'entries'
  | 'workspace_home'
  | 'producer_events'
  | 'programs'
  | 'messaging'
  | 'unknown';

interface RockerContext {
  userId: string | null;
  entityId: string | null;
  route: string;
  section: Section;
  log: (action: string, input?: Record<string, any>, output?: Record<string, any>, result?: 'success' | 'error') => Promise<void>;
  suggest: (kind?: string) => Promise<any[]>;
  act: (actionType: string, params?: Record<string, any>) => Promise<{ success: boolean; data?: any }>;
  why: (reason: string) => string;
}

const RockerContext = createContext<RockerContext | null>(null);

export function useRocker(): RockerContext {
  const context = useContext(RockerContext);
  if (!context) {
    throw new Error('useRocker must be used within RockerProvider');
  }
  return context;
}

export function RockerProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();
  
  const userId = session?.userId || null;
  const route = location.pathname;
  const section = deriveSection(route);
  const entityId = extractEntityId(route);

  const log = useCallback(async (
    action: string,
    input: Record<string, any> = {},
    output: Record<string, any> = {},
    result: 'success' | 'error' = 'success'
  ) => {
    if (!userId) return;

    try {
      // Check consent first
      const { data: consentData } = await supabase.rpc('rocker_check_consent', {
        p_user_id: userId,
        p_action_type: 'telemetry_basic'
      });

      const consent = consentData as { allowed: boolean } | null;
      if (!consent?.allowed) return;

      // Log the action with section context
      await supabase.rpc('rocker_log_action', {
        p_user_id: userId,
        p_agent: 'rocker_agent',
        p_action: action,
        p_input: { ...input, section, route, entity_id: entityId },
        p_output: output,
        p_result: result,
        p_entity_id: entityId
      });
    } catch (error) {
      console.error('[Rocker] Failed to log action:', error);
    }
  }, [userId, entityId, route, section]);

  const suggest = useCallback(async (kind?: string): Promise<any[]> => {
    if (!userId) return [];

    try {
      // Fetch recent actions as suggestions
      const { data } = await supabase
        .from('ai_action_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      return data || [];
    } catch (error) {
      console.error('[Rocker] Failed to fetch suggestions:', error);
      return [];
    }
  }, [userId]);

  const act = useCallback(async (
    actionType: string,
    params: Record<string, any> = {}
  ): Promise<{ success: boolean; data?: any }> => {
    if (!userId) {
      return { success: false };
    }

    try {
      // Log the intent
      await log(actionType, params, {}, 'success');
      
      // Route to specific actions
      // Future: add actual RPC calls for accept_module, set_theme, etc.
      
      return { success: true, data: params };
    } catch (error) {
      console.error('[Rocker] Failed to execute action:', error);
      await log(actionType, params, { error: String(error) }, 'error');
      return { success: false };
    }
  }, [userId, log]);

  const why = useCallback((reason: string): string => {
    return reason;
  }, []);

  const value: RockerContext = {
    userId,
    entityId,
    route,
    section,
    log,
    suggest,
    act,
    why,
  };

  return (
    <RockerContext.Provider value={value}>
      {children}
    </RockerContext.Provider>
  );
}

// Section resolver - maps to exact 10 sections
function deriveSection(pathname: string): Section {
  // Discovery
  if (pathname.startsWith('/search') || pathname.startsWith('/feed')) {
    return 'discovery';
  }
  
  // Marketplace
  if (
    pathname.startsWith('/marketplace') ||
    pathname.startsWith('/listings') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/orders')
  ) {
    return 'marketplace';
  }
  
  // Profiles
  if (pathname.startsWith('/entities') || pathname.startsWith('/u/')) {
    return 'profiles';
  }
  
  // EquineStats
  if (pathname.startsWith('/equinestats') || pathname.includes('/equinestats')) {
    return 'equinestats';
  }
  
  // Events (public)
  if (pathname.startsWith('/events') && !pathname.includes('/workspace')) {
    return 'events';
  }
  
  // Entries
  if (
    pathname.startsWith('/entries') ||
    pathname.startsWith('/entrant') ||
    pathname.includes('/my-entries') ||
    pathname.includes('/my-draws') ||
    pathname.includes('/my-results')
  ) {
    return 'entries';
  }
  
  // Workspace sections
  if (pathname.includes('/workspace')) {
    if (pathname.includes('/dashboard')) return 'workspace_home';
    if (pathname.includes('/events')) return 'producer_events';
    if (pathname.includes('/programs')) return 'programs';
    if (pathname.includes('/messages')) return 'messaging';
  }
  
  // Programs (legacy /incentives)
  if (pathname.startsWith('/incentives')) {
    return 'programs';
  }
  
  // Messaging (standalone)
  if (pathname.startsWith('/messages')) {
    return 'messaging';
  }
  
  return 'unknown';
}

function extractEntityId(pathname: string): string | null {
  // Match /workspace/:entityId/* or /entities/:id
  const workspaceMatch = pathname.match(/\/workspace\/([^\/]+)/);
  if (workspaceMatch) return workspaceMatch[1];
  
  const entityMatch = pathname.match(/\/entities\/([^\/]+)/);
  if (entityMatch) return entityMatch[1];
  
  return null;
}
