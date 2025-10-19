import { X } from 'lucide-react';
import { lazy, Suspense, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import AppLibrary from './AppLibrary';

// Lazy load all page components
const MarketplacePage = lazy(() => import('@/routes/marketplace/index'));
const MarketplaceDetailPage = lazy(() => import('@/routes/marketplace/[id]'));

interface AppTab {
  key: string;
  label: string;
  route?: string;
  icon?: LucideIcon;
  color?: string;
}

interface CenterContentAreaProps {
  openApps: AppTab[];
  activeApp: string | null;
  onCloseApp: (key: string) => void;
  onSelectApp: (key: string) => void;
  onAppClick: (app: AppTab) => void;
}

// App registry maps routes to components
const appRegistry: Record<string, ComponentType<any>> = {
  '/market': MarketplacePage,
  '/marketplace': MarketplacePage,
};

function AppRenderer({ app, onNavigate, onAppClick }: { app: AppTab; onNavigate: (url: string) => void; onAppClick: (app: AppTab) => void }) {
  // Intercept navigation for inline rendering
  const navigate = useNavigate();
  
  // Y'all App Library
  if (app.key === 'yall-library') {
    return <AppLibrary onAppClick={onAppClick} />;
  }
  
  // Match component by route
  if (app.route === '/market' || app.route === '/marketplace') {
    return <MarketplacePage />;
  }
  
  // Match marketplace detail pages
  if (app.route?.startsWith('/marketplace/')) {
    const id = app.route.split('/').pop();
    return <MarketplaceDetailPage />;
  }

  // Match entity pages
  if (app.route?.startsWith('/entity/')) {
    return (
      <div className="p-6 h-screen">
        <h2 className="text-2xl font-bold mb-4">{app.label}</h2>
        <p className="text-muted-foreground">Entity page coming soon...</p>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="p-6 h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">{app.label}</h2>
      <p className="text-muted-foreground">
        {app.label} content coming soon...
      </p>
    </div>
  );
}

export default function CenterContentArea({
  openApps,
  activeApp,
  onCloseApp,
  onSelectApp,
  onAppClick
}: CenterContentAreaProps) {
  const handleInternalNavigate = (url: string) => {
    // Extract route info
    const urlParts = url.split('/');
    let key = url;
    let label = 'Page';
    
    if (url.startsWith('/marketplace/')) {
      const id = urlParts[2];
      key = `marketplace-${id}`;
      label = 'Product Details';
    }
    
    // Open as new app
    onAppClick({ key, label, route: url });
  };
  
  const scrollToApp = (key: string) => {
    const element = document.querySelector(`[data-app-key="${key}"]`);
    element?.scrollIntoView({ behavior: 'smooth' });
    onSelectApp(key);
  };

  if (openApps.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        <p>Click an app to open it here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar with app icons - macOS dock style */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-xl border-b border-border/40 flex items-center gap-2 px-6 py-3 shadow-lg">
        {openApps.map((app) => (
          <div key={app.key} className="relative group">
            <button
              onClick={() => scrollToApp(app.key)}
              title={app.label}
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200
                bg-gradient-to-br from-background via-muted/50 to-muted
                shadow-md hover:scale-110 hover:shadow-xl
                ${activeApp === app.key 
                  ? 'ring-2 ring-primary/50 scale-105 border-2 border-primary/30' 
                  : 'border border-border/50 hover:border-primary/40'
                }
                ${app.color || 'text-foreground'}
              `}
            >
              {app.icon && <app.icon className="w-6 h-6" />}
            </button>
            
            {/* Close button on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseApp(app.key);
              }}
              title="Close"
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Scrollable app content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/5 to-background">
      {/* Render all open apps stacked vertically */}
      {openApps.map((app) => (
        <div
          key={app.key}
          data-app-key={app.key}
          className="min-h-screen p-6"
        >
          {/* Mac-style app card */}
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl bg-background shadow-2xl border border-border/50 overflow-hidden">
              {/* App Header - Glass effect */}
              <div className="bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 backdrop-blur-sm border-b border-border/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {app.icon && (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-background to-muted border flex items-center justify-center ${app.color || 'text-foreground'}`}>
                        <app.icon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold">{app.label}</h2>
                      <p className="text-xs text-muted-foreground">Y'all Dashboard</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onCloseApp(app.key)}
                    className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* App Body */}
              <div className="p-6">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-pulse text-muted-foreground">Loading...</div>
                  </div>
                }>
                  <div onClick={(e) => {
                    // Intercept all link clicks
                    const target = e.target as HTMLElement;
                    const link = target.closest('a');
                    if (link && link.href) {
                      const url = new URL(link.href);
                      if (url.origin === window.location.origin) {
                        e.preventDefault();
                        handleInternalNavigate(url.pathname);
                      }
                    }
                  }}>
                    <AppRenderer app={app} onNavigate={handleInternalNavigate} onAppClick={onAppClick} />
                  </div>
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}