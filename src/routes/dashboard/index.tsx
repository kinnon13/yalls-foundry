import { Suspense, lazy, useMemo, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Wallpaper } from '@/components/appearance/Wallpaper';
import { ScreenSaver } from '@/components/appearance/ScreenSaver';
import { useAppearance } from '@/hooks/useAppearance';
import { supabase } from '@/integrations/supabase/client';
import { DraggableAppGrid } from '@/components/desktop/DraggableAppGrid';
import { DebugOverlay } from '@/feature-kernel/DebugOverlay';
import { FeatureErrorBoundary } from '@/feature-kernel/ErrorBoundary';
import { coerceModule, type ModuleKey } from '@/lib/dashUrl';

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

function PanelSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-muted rounded w-full mb-2"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
    </div>
  );
}

export default function DashboardLayout() {
  const [sp] = useSearchParams();
  const rawModule = sp.get('m');
  const m = coerceModule(rawModule);
  const [userId, setUserId] = useState<string | null>(null);
  
  const Panel = useMemo(() => panels[m] ?? panels.overview, [m]);

  // Get user ID for appearance settings
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Load user appearance settings
  const { data: appearance } = useAppearance({ 
    type: 'user', 
    id: userId || '' 
  });

  // Update document title on module change
  useEffect(() => {
    const titles: Record<ModuleKey, string> = {
      overview: 'Dashboard Overview',
      business: 'Business Management',
      producers: 'Producers',
      incentives: 'Incentives',
      stallions: 'Stallions',
      farm_ops: 'Farm Operations',
      events: 'Calendar',
      orders: 'Orders',
      earnings: 'Earnings',
      messages: 'Messages',
      approvals: 'Approvals',
      settings: 'Settings',
    };
    document.title = titles[m] || 'Dashboard';
  }, [m]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Wallpaper background - fixed, full screen, z-0 */}
      {appearance?.wallpaper_url && (
        <Wallpaper
          url={appearance.wallpaper_url}
          blur={(appearance.screensaver_payload as any)?.blur}
          dim={(appearance.screensaver_payload as any)?.dim}
        />
      )}

      {/* Blur/dim overlay - only when wallpaper is present */}
      {appearance?.wallpaper_url && (
        <div 
          className="fixed inset-0 z-10 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Screen saver overlay - z-40 */}
      {appearance?.screensaver_payload && (
        <ScreenSaver payload={appearance.screensaver_payload as any} />
      )}

      <GlobalHeader />
      
      {/* Main content area - z-20 */}
      <div className="relative z-20 h-[calc(100vh-64px)] overflow-auto">
        {m ? (
          <div className="container mx-auto p-6">
            <FeatureErrorBoundary featureId={`dashboard.${m}`}>
              <Suspense fallback={<PanelSkeleton />}>
                <Panel />
              </Suspense>
            </FeatureErrorBoundary>
          </div>
        ) : (
          <DraggableAppGrid />
        )}
      </div>

      <DebugOverlay />
    </div>
  );
}
