import { Suspense, lazy, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import FeatureHost from '@/feature-kernel/Host';
import { DebugOverlay } from '@/feature-kernel/DebugOverlay';
import type { ModuleKey } from '@/lib/dashUrl';

const panels = {
  overview: lazy(() => import('./overview')),
  business: lazy(() => import('./business')),
  producers: lazy(() => import('./producers')),
  incentives: lazy(() => import('./incentives')),
  stallions: lazy(() => import('./stallions')),
  farm_ops: lazy(() => import('./farm-ops')),
  events: lazy(() => import('./events')),
  orders: lazy(() => import('./orders')),
  earnings: lazy(() => import('./earnings')),
  messages: lazy(() => import('../messages')),
  approvals: lazy(() => import('./approvals')),
  settings: lazy(() => import('./settings')),
} as const;

export default function DashboardLayout() {
  const isMobile = useIsMobile();
  const [sp] = useSearchParams();
  const m = (sp.get('m') as ModuleKey) || 'overview';
  const f = sp.get('f'); // feature list
  
  const Panel = useMemo(() => panels[m] ?? panels.overview, [m]);

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <div className="flex h-[calc(100vh-64px)]">
        {!isMobile && <DashboardSidebar />}
        <main className="flex-1 overflow-auto p-4">
          {f ? (
            <FeatureHost />
          ) : (
            <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
              <Panel />
            </Suspense>
          )}
        </main>
      </div>
      <DebugOverlay />
    </div>
  );
}
