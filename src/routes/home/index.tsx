import { useState } from 'react';
import LeftAppSidebar from './parts/LeftAppSidebar';
import CenterContentArea from './parts/CenterContentArea';
import SocialFeedPane from './parts/SocialFeedPane';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BottomDock } from '@/components/layout/BottomDock';

interface AppTab {
  key: string;
  label: string;
  route?: string;
}

export default function HomePage() {
  const [openApps, setOpenApps] = useState<AppTab[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const handleAppClick = (app: { key: string; label: string; route?: string }) => {
    // Check if app is already open
    if (!openApps.find(a => a.key === app.key)) {
      setOpenApps([...openApps, app]);
    }
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
            />
          </div>

          {/* Right: Social Feed - Fixed */}
          <div className="w-[420px] flex-shrink-0 border-l overflow-hidden">
            <SocialFeedPane />
          </div>
        </div>

        {/* Mobile: Show social feed only for now */}
        <div className="md:hidden">
          <SocialFeedPane />
        </div>
      </main>
      <BottomDock />
    </>
  );
}

