/**
 * Home Shell (Universal)
 * Single page with three-column Mac layout
 * Left: Apps rail | Center: Window canvas (overlays) | Right: Feed
 * Mode switching via ?mode=social|manage
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOverlay } from '@/lib/overlay/OverlayProvider';
import HeaderBar from '@/components/chrome/HeaderBar';
import Dock from '@/components/chrome/Dock';
import AppsRail from '@/components/home/AppsRail';
import { FeedPane } from '@/components/home/FeedPane';
import LinkInterceptor from '@/components/chrome/LinkInterceptor';

export default function HomeShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { open } = useOverlay();
  const mode = (searchParams.get('mode') ?? 'social') as 'social' | 'manage';

  // Open overlay if ?app= is present
  useEffect(() => {
    const app = searchParams.get('app');
    if (app) {
      open(app as any);
      // Don't remove the param - let the OverlayProvider handle it
    }
  }, []);

  return (
    <div className="shell">
      <HeaderBar />
      
      <main className="content">
        {mode === 'social' ? (
          <div className="grid-social">
            <AppsRail />
            
            {/* Center canvas - overlays float above via portal */}
            <div className="window-canvas card" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(20, 20, 26, 0.5)',
              position: 'relative'
            }}>
              <div style={{ 
                textAlign: 'center', 
                color: 'rgba(255,255,255,0.25)',
                fontSize: '13px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                Select an app to begin
              </div>
            </div>
            
            <FeedPane />
          </div>
        ) : (
          <div className="grid-manage">
            <AppsRail manage />
            
            <div className="card" style={{ padding: '24px', overflow: 'auto' }}>
              <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
              <p className="text-muted-foreground">Management tools and analytics</p>
            </div>
          </div>
        )}
      </main>
      
      <Dock />
      <LinkInterceptor />
    </div>
  );
}
