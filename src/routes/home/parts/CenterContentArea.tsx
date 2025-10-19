import { X } from 'lucide-react';
import { lazy, Suspense, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

// Lazy load all page components
const MarketplacePage = lazy(() => import('@/routes/marketplace/index'));
const MarketplaceDetailPage = lazy(() => import('@/routes/marketplace/[id]'));

interface AppTab {
  key: string;
  label: string;
  route?: string;
  icon?: LucideIcon;
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

function AppRenderer({ app, onNavigate }: { app: AppTab; onNavigate: (url: string) => void }) {
  // Intercept navigation for inline rendering
  const navigate = useNavigate();
  
  // Override navigate to open inline instead
  const interceptedNavigate = (to: string) => {
    onNavigate(to);
  };

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
      {/* Top bar with app icons */}
      <div className="sticky top-0 z-20 bg-muted/20 border-b flex items-center gap-3 px-4 py-3">
        {openApps.map((app) => (
          <div key={app.key} className="relative group">
            <button
              onClick={() => scrollToApp(app.key)}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center transition-all
                ${activeApp === app.key 
                  ? 'bg-background border-2 border-primary shadow-md' 
                  : 'bg-background border hover:border-primary'
                }
              `}
            >
              {app.icon && <app.icon className="w-5 h-5" />}
            </button>
            
            {/* Close button on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseApp(app.key);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Scrollable app content */}
      <div className="flex-1 overflow-y-auto">
      {/* Render all open apps stacked vertically */}
      {openApps.map((app) => (
        <div
          key={app.key}
          data-app-key={app.key}
          className="min-h-screen relative border-b"
        >
          {/* App content */}
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
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
              <AppRenderer app={app} onNavigate={handleInternalNavigate} />
            </div>
          </Suspense>
        </div>
      ))}
      </div>
    </div>
  );
}