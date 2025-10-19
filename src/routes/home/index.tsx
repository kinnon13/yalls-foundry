import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LeftAppSidebar from './parts/LeftAppSidebar';
import CenterContentArea from './parts/CenterContentArea';
import SocialFeedPane from './parts/SocialFeedPane';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BottomDock } from '@/components/layout/BottomDock';
import { Store, Grid, MessageCircle } from 'lucide-react';
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
  const [mobileView, setMobileView] = useState<'library' | 'apps' | 'feed'>('apps');

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
      <GlobalHeader />
      <main className="pt-14 pb-16">
        {/* Desktop/Tablet Layout: Sidebar + Center + Feed */}
        <div className="hidden md:flex h-[calc(100vh-112px)]">
          {/* Left: Apps Sidebar - Fixed */}
          <div className="w-[280px] flex-shrink-0 overflow-hidden">
            <LeftAppSidebar onAppClick={handleAppClick} />
          </div>

          {/* Center: Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <CenterContentArea
              openApps={openApps}
              activeApp={activeApp}
              onCloseApp={handleCloseApp}
              onSelectApp={setActiveApp}
              onAppClick={handleAppClick}
            />
          </div>

          {/* Right: Social Feed - Fixed */}
          <div className="w-[420px] flex-shrink-0 border-l overflow-hidden">
            <SocialFeedPane />
          </div>
        </div>

        {/* Mobile/Tablet: Tabbed view with icons */}
        <div className="md:hidden h-[calc(100vh-112px)] flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center justify-around border-b bg-background">
            <button
              onClick={() => setMobileView('library')}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
                mobileView === 'library'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Store className="w-5 h-5" />
              <span className="text-xs font-medium">Library</span>
            </button>
            
            <button
              onClick={() => setMobileView('apps')}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
                mobileView === 'apps'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Grid className="w-5 h-5" />
              <span className="text-xs font-medium">Apps</span>
            </button>
            
            <button
              onClick={() => setMobileView('feed')}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
                mobileView === 'feed'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-medium">Feed</span>
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            {mobileView === 'library' && (
              <div className="h-full overflow-y-auto p-4">
                <LeftAppSidebar onAppClick={(app) => {
                  handleAppClick(app);
                  setMobileView('apps'); // Switch to apps view after selecting
                }} />
              </div>
            )}
            
            {mobileView === 'apps' && (
              <div className="h-full overflow-y-auto">
                <CenterContentArea
                  openApps={openApps}
                  activeApp={activeApp}
                  onCloseApp={handleCloseApp}
                  onSelectApp={setActiveApp}
                  onAppClick={handleAppClick}
                />
              </div>
            )}
            
            {mobileView === 'feed' && (
              <div className="h-full overflow-hidden">
                <SocialFeedPane />
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomDock />
    </>
  );
}

