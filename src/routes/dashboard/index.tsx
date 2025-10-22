/**
 * 🔒 PRODUCTION-LOCKED DASHBOARD
 * DO NOT MODIFY without explicit user approval
 * Last finalized: 2025-01-22
 * 
 * Dashboard (Authenticated User View)
 * Clone of Home Shell - Single page with three-column Mac layout
 * Left: Apps rail | Center: Window canvas (overlays) | Right: Feed
 */

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OverlayKey } from '@/lib/overlay/types';
import { OVERLAY_REGISTRY } from '@/lib/overlay/registry';
import HeaderBar from '@/components/chrome/HeaderBar';
import Dock from '@/components/chrome/Dock';
import AppLibrary from '../home/parts/AppLibrary';
import { FeedPane } from '@/components/home/FeedPane';
import LinkInterceptor from '@/components/chrome/LinkInterceptor';
import { X } from 'lucide-react';
import SocialFeedPane from '../home/parts/SocialFeedPane';
import { MobileTabBar } from '@/components/mobile/MobileTabBar';
import { CreateModalRouter } from '@/components/modals/CreateModalRouter';
import OverlayHost from '@/lib/overlay/OverlayHost';
import PanelHost from '@/lib/panel/PanelHost';

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
          <Component contextType="user" contextId="" mode="overlay" />
        </Suspense>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeApp = searchParams.get('app') as OverlayKey | null;

  const handleAppClick = (app: { key: string; label: string; icon?: any; color?: string }) => {
    const next = new URLSearchParams(searchParams);
    next.set('app', app.key);
    setSearchParams(next, { replace: true });
  };

  const closeApp = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('app');
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      {/* Desktop: Mac-style shell */}
      <div className="hidden lg:flex flex-col h-screen">
        <HeaderBar />
        
        <main className="flex-1 overflow-hidden">
          {/* Desktop: Pixel-Perfect Three-Column Grid */}
          <div className="h-full grid grid-cols-[360px_1fr_360px] gap-12 px-0 py-8 bg-gradient-to-br from-muted/40 via-muted/30 to-background/95">
            <div className="w-[360px] flex-shrink-0 overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-background via-background to-background/98 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.08),0_24px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.12),0_32px_64px_rgba(0,0,0,0.16)] transition-all duration-300">
              <AppLibrary onAppClick={handleAppClick} />
            </div>
            
            {/* Center area - becomes the active app */}
            <div className="rounded-3xl border border-border/40 bg-gradient-to-b from-muted/30 via-background/80 to-background/95 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.12)] transition-all duration-300" style={{ 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              {/* Overlays render here - isolated to /dashboard only */}
              <OverlayHost />
              <PanelHost />
              
              {!activeApp && (
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
            
            <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-background via-background to-background/98 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.08),0_24px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.12),0_32px_64px_rgba(0,0,0,0.16)] transition-all duration-300 overflow-hidden">
              <SocialFeedPane />
            </div>
          </div>
        </main>
        
        <Dock onAppClick={(appId: string) => handleAppClick({ key: appId, label: appId })} />
      </div>

      {/* Mobile: Full-screen feed with fixed tab bar */}
      <div className="lg:hidden flex flex-col h-[100dvh] bg-background">
        <HeaderBar />
        <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch">
          <SocialFeedPane />
          {/* Spacer for fixed tab bar */}
          <div className="h-[calc(64px+env(safe-area-inset-bottom,0px))]" />
        </div>
        <MobileTabBar />
      </div>
      <CreateModalRouter />
      <LinkInterceptor />
    </>
  );
}
