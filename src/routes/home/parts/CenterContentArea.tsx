import { X } from 'lucide-react';
import { lazy, Suspense, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';

// Lazy load all page components
const MarketplacePage = lazy(() => import('@/routes/marketplace/index'));
const MarketplaceDetailPage = lazy(() => import('@/routes/marketplace/[id]'));

interface AppTab {
  key: string;
  label: string;
  route?: string;
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

  if (openApps.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        <p>Click an app to open it here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Render all open apps stacked vertically */}
      {openApps.map((app) => (
        <div
          key={app.key}
          data-app-key={app.key}
          className="min-h-screen relative border-b"
        >
          {/* Close button for each app */}
          <button
            onClick={() => onCloseApp(app.key)}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

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
  );
}