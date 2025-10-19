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
        {/* Desktop Layout: Three-column precision grid */}
        <div className="hidden lg:flex h-[calc(100dvh-112px)] gap-6 p-6 bg-gradient-to-br from-muted/40 via-muted/30 to-background/95">
          {/* Left: Y'all Library - Primary elevation */}
          <div className="w-[380px] flex-shrink-0 overflow-hidden rounded-[24px] border border-border/50 bg-gradient-to-b from-background via-background to-background/98 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.08),0_24px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.12),0_32px_64px_rgba(0,0,0,0.16)] transition-all duration-300">
            <AppLibrary onAppClick={handleAppClick} />
          </div>

          {/* Center: Content Canvas - Secondary elevation */}
          <div className="flex-1 overflow-y-auto rounded-[24px] border border-border/40 bg-gradient-to-b from-muted/30 via-background/80 to-background/95 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.12)] transition-all duration-300">
            <CenterContentArea
              openApps={openApps}
              activeApp={activeApp}
              onCloseApp={handleCloseApp}
              onSelectApp={setActiveApp}
              onAppClick={handleAppClick}
            />
          </div>

          {/* Right: Social Feed - Primary elevation */}
          <div className="w-[380px] flex-shrink-0 overflow-hidden rounded-[24px] border border-border/50 bg-gradient-to-b from-background via-background to-background/98 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.08),0_24px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.12),0_32px_64px_rgba(0,0,0,0.16)] transition-all duration-300">
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

