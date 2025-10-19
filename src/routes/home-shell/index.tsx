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
import { DashboardContent } from './DashboardContent';
import LinkInterceptor from '@/components/chrome/LinkInterceptor';

export default function HomeShell() {
  const [searchParams] = useSearchParams();
  const { open } = useOverlay();

  // Open overlay if ?app= is present
  useEffect(() => {
    const app = searchParams.get('app');
    if (app) {
      open(app as any);
    }
  }, []);

  return (
    <div className="shell">
      <HeaderBar />
      
      <main className="content">
        <div className="grid-social">
          <AppsRail />
          
          {/* Center - Dashboard content with MLM tree */}
          <div className="card" style={{ 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <DashboardContent />
          </div>
          
          <FeedPane />
        </div>
      </main>
      
      <Dock />
      <LinkInterceptor />
    </div>
  );
}
