import { X } from 'lucide-react';
import { lazy, Suspense } from 'react';

const MarketplacePage = lazy(() => import('@/routes/marketplace/index'));

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
}

export default function CenterContentArea({
  openApps,
  activeApp,
  onCloseApp,
  onSelectApp
}: CenterContentAreaProps) {
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
          className="min-h-screen relative border-b"
        >
          {/* Close button for each app */}
          <button
            onClick={() => onCloseApp(app.key)}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App content */}
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            {app.route === '/market' ? (
              <MarketplacePage />
            ) : (
              <div className="p-6 h-screen flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">{app.label}</h2>
                <p className="text-muted-foreground">
                  {app.label} content coming soon...
                </p>
              </div>
            )}
          </Suspense>
        </div>
      ))}
    </div>
  );
}
