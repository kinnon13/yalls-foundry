import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLibrary from './parts/AppLibrary';
import CenterContentArea from './parts/CenterContentArea';
import SocialFeedPane from './parts/SocialFeedPane';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BottomDock } from '@/components/layout/BottomDock';
import { cn } from '@/lib/utils';

interface AppTab {
  key: string;
  label: string;
  route?: string;
  icon?: any;
  color?: string;
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openApps, setOpenApps] = useState<AppTab[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'library' | 'apps' | 'feed'>('feed');

  // Restore tabs from URL on mount
  useEffect(() => {
    const appParam = searchParams.get('app');
    if (appParam && openApps.length === 0) {
      // Restore from URL - for now just open the app library as default
      handleAppClick({
        key: 'yall-library',
        label: 'Y\'all App Library',
        icon: undefined,
        color: 'text-primary'
      });
    }
  }, []);

  // Update URL when active app changes
  useEffect(() => {
    if (activeApp) {
      setSearchParams({ app: activeApp }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [activeApp]);

  const handleAppClick = (app: { key: string; label: string; route?: string; icon?: any; color?: string }) => {
    // Deduplicate: if already open, just focus it
    const existing = openApps.find(a => a.key === app.key);
    if (existing) {
      setActiveApp(app.key);
      // Scroll to that app in the center
      setTimeout(() => {
        const element = document.querySelector(`[data-app-key="${app.key}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }
    
    // Add new app
    setOpenApps([...openApps, app]);
    setActiveApp(app.key);
  };

  const handleCloseApp = (key: string) => {
    const newOpenApps = openApps.filter(a => a.key !== key);
    setOpenApps(newOpenApps);
    
    // If closing the active app, switch to the last remaining app
    if (activeApp === key && newOpenApps.length > 0) {
      setActiveApp(newOpenApps[newOpenApps.length - 1].key);
    } else if (newOpenApps.length === 0) {
      setActiveApp(null);
    }
  };

  return (
    <>
      <GlobalHeader className={mobileView === 'feed' ? 'hidden lg:block' : undefined} />
      <main className={cn(mobileView === 'feed' ? 'pt-0 pb-16' : 'pt-14 pb-16')}>
        {/* Desktop Layout: Sidebar + Center + Feed (large screens only) */}
        <div className="hidden lg:flex h-[calc(100dvh-112px)] gap-4 p-4 bg-muted/30">
          {/* Left: Y'all Library - Elevated */}
          <div className="w-[340px] flex-shrink-0 overflow-hidden rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl">
            <AppLibrary onAppClick={handleAppClick} />
          </div>

          {/* Center: Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl">
            <CenterContentArea
              openApps={openApps}
              activeApp={activeApp}
              onCloseApp={handleCloseApp}
              onSelectApp={setActiveApp}
              onAppClick={handleAppClick}
            />
          </div>

          {/* Right: Social Feed - Fixed */}
          <div className="w-[420px] flex-shrink-0 overflow-hidden rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl">
            <SocialFeedPane />
          </div>
        </div>

        {/* Mobile/Tablet: Feed-only full-screen */}
        <div className="lg:hidden h-[100dvh] overflow-hidden">
          <SocialFeedPane />
        </div>
      </main>
      <BottomDock />
    </>
  );
}

