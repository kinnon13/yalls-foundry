/**
 * Desktop Manager - macOS-style Desktop with App Windows
 */

import { useState, Suspense, lazy } from 'react';
import { AppWindow } from './AppWindow';
import { AppDock, DockApp } from './AppDock';
import { 
  Calendar, 
  Settings, 
  DollarSign, 
  Trophy, 
  ShoppingCart,
  Building,
  Users,
  Sparkles,
  Tractor,
  CheckCircle,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';

const panels = {
  overview: lazy(() => import('@/routes/dashboard/overview')),
  calendar: lazy(() => import('@/routes/dashboard/events')),
  settings: lazy(() => import('@/routes/dashboard/settings')),
  earnings: lazy(() => import('@/routes/dashboard/earnings')),
  incentives: lazy(() => import('@/routes/dashboard/incentives')),
  orders: lazy(() => import('@/routes/dashboard/orders')),
  business: lazy(() => import('@/routes/dashboard/business')),
  producers: lazy(() => import('@/routes/dashboard/producers')),
  stallions: lazy(() => import('@/routes/dashboard/stallions')),
  farm_ops: lazy(() => import('@/routes/dashboard/farm-ops')),
  approvals: lazy(() => import('@/routes/dashboard/approvals')),
  messages: lazy(() => import('@/routes/messages')),
};

const APPS: DockApp[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'incentives', label: 'Incentives', icon: Trophy },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'business', label: 'Business', icon: Building },
  { id: 'producers', label: 'Producers', icon: Users },
  { id: 'stallions', label: 'Stallions', icon: Sparkles },
  { id: 'farm_ops', label: 'Farm Ops', icon: Tractor },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface OpenWindow {
  id: string;
  appId: string;
  position: { x: number; y: number };
  isMinimized: boolean;
}

function AppSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-muted rounded w-full mb-2"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
    </div>
  );
}

export function DesktopManager() {
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);

  const handleAppClick = (appId: string) => {
    const existingWindow = openWindows.find(w => w.appId === appId);
    
    if (existingWindow) {
      if (existingWindow.isMinimized) {
        // Restore from minimized
        setOpenWindows(windows =>
          windows.map(w =>
            w.id === existingWindow.id ? { ...w, isMinimized: false } : w
          )
        );
      }
      // If already open and not minimized, do nothing (bring to front could be added)
    } else {
      // Open new window
      const newWindow: OpenWindow = {
        id: `${appId}-${Date.now()}`,
        appId,
        position: {
          x: 100 + (openWindows.length * 30),
          y: 80 + (openWindows.length * 30)
        },
        isMinimized: false
      };
      setOpenWindows([...openWindows, newWindow]);
    }
  };

  const handleClose = (windowId: string) => {
    setOpenWindows(windows => windows.filter(w => w.id !== windowId));
  };

  const handleMinimize = (windowId: string) => {
    setOpenWindows(windows =>
      windows.map(w =>
        w.id === windowId ? { ...w, isMinimized: true } : w
      )
    );
  };

  const dockApps = APPS.map(app => ({
    ...app,
    isOpen: openWindows.some(w => w.appId === app.id && !w.isMinimized),
    isMinimized: openWindows.some(w => w.appId === app.id && w.isMinimized)
  }));

  return (
    <>
      {/* Desktop Area */}
      <div className="fixed inset-0 overflow-hidden">
        {openWindows.map((window) => {
          if (window.isMinimized) return null;
          
          const app = APPS.find(a => a.id === window.appId);
          if (!app) return null;

          const Panel = panels[window.appId as keyof typeof panels];
          const Icon = app.icon;

          return (
            <AppWindow
              key={window.id}
              appId={window.appId}
              title={app.label}
              icon={<Icon className="w-5 h-5" />}
              onClose={() => handleClose(window.id)}
              onMinimize={() => handleMinimize(window.id)}
              defaultPosition={window.position}
            >
              <Suspense fallback={<AppSkeleton />}>
                {Panel && <Panel />}
              </Suspense>
            </AppWindow>
          );
        })}
      </div>

      {/* Dock */}
      <AppDock apps={dockApps} onAppClick={handleAppClick} />
    </>
  );
}
