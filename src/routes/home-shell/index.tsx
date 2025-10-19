/**
 * Home Shell (Universal)
 * Single page with three-column Mac layout
 * Left: Apps rail | Center: Window canvas (overlays) | Right: Feed
 * Mode switching via ?mode=social|manage
 */

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OverlayKey } from '@/lib/overlay/types';
import { OVERLAY_REGISTRY } from '@/lib/overlay/registry';
import HeaderBar from '@/components/chrome/HeaderBar';
import Dock from '@/components/chrome/Dock';
import AppsRail from '@/components/home/AppsRail';
import { FeedPane } from '@/components/home/FeedPane';
import LinkInterceptor from '@/components/chrome/LinkInterceptor';
import { X } from 'lucide-react';

function ActiveAppContent({ appId, onClose }: { appId: OverlayKey; onClose: () => void }) {
  const config = OVERLAY_REGISTRY[appId];
  if (!config) return null;

  const Component = config.component;

  return (
    <>
      {/* App titlebar */}
      <div style={{
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.03)',
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
        >
          <X size={18} />
          Close
        </button>
        <div style={{
          flex: 1,
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '15px',
          opacity: 0.9,
        }}>
          {config.title}
        </div>
        <div style={{ width: '80px' }} />
      </div>
      
      {/* App content */}
      <div style={{ flex: 1, overflow: 'auto', background: 'rgba(0, 0, 0, 0.2)' }}>
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <Component />
        </Suspense>
      </div>
    </>
  );
}

export default function HomeShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeApp = searchParams.get('app') as OverlayKey | null;

  const openApp = (appId: OverlayKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('app', appId);
    setSearchParams(next, { replace: true });
  };

  const closeApp = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('app');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="shell">
      <HeaderBar />
      
      <main className="content">
        <div className="grid-social">
          <AppsRail onAppClick={openApp} />
          
          {/* Center area - becomes the active app */}
          <div className="card" style={{ 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(20, 20, 26, 0.5)',
            position: 'relative'
          }}>
            {activeApp ? (
              <ActiveAppContent appId={activeApp} onClose={closeApp} />
            ) : (
              <div style={{ 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center', 
                color: 'rgba(255,255,255,0.25)',
                fontSize: '13px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                Select an app to begin
              </div>
            )}
          </div>
          
          <FeedPane />
        </div>
      </main>
      
      <Dock onAppClick={openApp} />
      <LinkInterceptor />
    </div>
  );
}
