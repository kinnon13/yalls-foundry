import { useEffect, useState } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Wallpaper } from '@/components/appearance/Wallpaper';
import { ScreenSaver } from '@/components/appearance/ScreenSaver';
import { useAppearance } from '@/hooks/useAppearance';
import { supabase } from '@/integrations/supabase/client';
import { DesktopManager } from '@/components/desktop/DesktopManager';
import { DebugOverlay } from '@/feature-kernel/DebugOverlay';

export default function DashboardLayout() {
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID for appearance settings
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Load user appearance settings
  const { data: appearance } = useAppearance({ 
    type: 'user', 
    id: userId || '' 
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Wallpaper background */}
      {appearance?.wallpaper_url && (
        <Wallpaper
          url={appearance.wallpaper_url}
          blur={(appearance.screensaver_payload as any)?.blur}
          dim={(appearance.screensaver_payload as any)?.dim}
        />
      )}

      {/* Screen saver overlay */}
      {appearance?.screensaver_payload && (
        <ScreenSaver payload={appearance.screensaver_payload as any} />
      )}

      <GlobalHeader />
      
      {/* macOS Desktop with App Windows */}
      <div className="h-[calc(100vh-64px)] relative">
        <DesktopManager />
      </div>

      <DebugOverlay />
    </div>
  );
}
