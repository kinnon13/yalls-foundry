/**
 * Home Shell (New)
 * Strict 3-row grid: Header | Content | Dock
 * No body scroll, panes scroll independently
 * Desktop: Apps pane + Feed pane
 * Phone: 4-screen pager (Apps | Feed | Shop | Profile)
 */

import { useState } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Dock } from '@/components/home/Dock';
import { FavoritesRail } from '@/components/home/FavoritesRail';
import { FeedPane } from '@/components/home/FeedPane';
import { LibrarySearch } from '@/components/library/LibrarySearch';
import { Pinboard } from '@/components/library/Pinboard';
import { DebugHUD } from '@/components/debug/DebugHUD';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HomeShell() {
  const [phoneScreen, setPhoneScreen] = useState<'apps' | 'feed' | 'shop' | 'profile'>('feed');

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Fixed */}
      <div className="h-[var(--header-h)] shrink-0 z-40">
        <GlobalHeader />
      </div>

      {/* Content - Scrollable panes */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop/Tablet Layout */}
        <div className="hidden md:flex h-full">
          {/* Left: Apps Pane */}
          <div className="w-80 border-r flex flex-col overflow-hidden">
            <FavoritesRail />
            <div className="flex-1 overflow-y-auto">
              <LibrarySearch />
              <Pinboard contextId="home" />
            </div>
          </div>

          {/* Right: Feed Pane */}
          <div className="flex-1 overflow-hidden">
            <FeedPane />
          </div>
        </div>

        {/* Phone Layout - 4-screen pager */}
        <div className="md:hidden h-full">
          <Tabs value={phoneScreen} onValueChange={(v) => setPhoneScreen(v as any)} className="h-full flex flex-col">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="apps" className="flex-1">Apps</TabsTrigger>
              <TabsTrigger value="feed" className="flex-1">Feed</TabsTrigger>
              <TabsTrigger value="shop" className="flex-1">Shop</TabsTrigger>
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {phoneScreen === 'apps' && (
                <div className="h-full overflow-y-auto">
                  <FavoritesRail />
                  <LibrarySearch />
                  <Pinboard contextId="home" />
                </div>
              )}
              {phoneScreen === 'feed' && <FeedPane />}
              {phoneScreen === 'shop' && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Shop coming soon
                </div>
              )}
              {phoneScreen === 'profile' && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Profile coming soon
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Dock - Fixed */}
      <div className="h-[var(--dock-h)] shrink-0 z-40">
        <Dock />
      </div>

      {/* Debug HUD (dev only) */}
      <DebugHUD />
    </div>
  );
}
