import { X } from 'lucide-react';

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
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Click an app to open it here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b px-2 py-2 bg-muted/20">
        {openApps.map((app) => (
          <button
            key={app.key}
            onClick={() => onSelectApp(app.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors
              ${activeApp === app.key ? 'bg-background border border-b-0' : 'bg-muted/50 hover:bg-muted'}
            `}
          >
            <span className="text-sm font-medium">{app.label}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseApp(app.key);
              }}
              className="hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {openApps.map((app) => (
          <div
            key={app.key}
            className={activeApp === app.key ? 'block' : 'hidden'}
          >
            <h2 className="text-2xl font-bold mb-4">{app.label}</h2>
            <p className="text-muted-foreground">
              Content for {app.label} would go here...
            </p>
            {/* TODO: Render actual app content based on app.route */}
          </div>
        ))}
      </div>
    </div>
  );
}
