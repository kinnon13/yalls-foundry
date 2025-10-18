/**
 * Rocker Agent Provider
 * Provides route, user, and entity context for section-level Rocker integration
 */

import { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';

interface RockerAgentContext {
  userId: string | null;
  entityId: string | null;
  route: string;
  section: string;
}

const RockerAgentContext = createContext<RockerAgentContext | null>(null);

export function useRockerAgent() {
  const context = useContext(RockerAgentContext);
  if (!context) {
    throw new Error('useRockerAgent must be used within RockerAgentProvider');
  }
  return context;
}

export function RockerAgentProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();
  
  // Derive section from route
  const section = deriveSection(location.pathname);
  
  // Extract entityId from route if present
  const entityId = extractEntityId(location.pathname);
  
  const value: RockerAgentContext = {
    userId: session?.userId || null,
    entityId,
    route: location.pathname,
    section,
  };

  return (
    <RockerAgentContext.Provider value={value}>
      {children}
    </RockerAgentContext.Provider>
  );
}

function deriveSection(pathname: string): string {
  if (pathname.startsWith('/search') || pathname.startsWith('/feed')) return 'discovery';
  if (pathname.startsWith('/marketplace') || pathname.startsWith('/listings') || pathname.startsWith('/cart') || pathname.startsWith('/orders')) return 'marketplace';
  if (pathname.startsWith('/entities') || pathname.startsWith('/u/')) return 'profile';
  if (pathname.startsWith('/equinestats') || pathname.includes('/equinestats')) return 'equinestats';
  if (pathname.startsWith('/events') && !pathname.includes('/workspace')) return 'events';
  if (pathname.startsWith('/entrant') || pathname.includes('/my-entries') || pathname.includes('/my-draws') || pathname.includes('/my-results')) return 'entries';
  if (pathname.startsWith('/workspace') && pathname.includes('/dashboard')) return 'workspace_home';
  if (pathname.startsWith('/workspace') && pathname.includes('/events')) return 'producer_events';
  if (pathname.startsWith('/workspace') && pathname.includes('/programs')) return 'programs';
  if (pathname.startsWith('/workspace') && pathname.includes('/messages')) return 'messaging';
  if (pathname.startsWith('/incentives')) return 'programs';
  if (pathname.startsWith('/messages')) return 'messaging';
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
