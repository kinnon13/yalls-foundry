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
      <div className="flex-1 overflow-auto">
        {openApps.map((app) => (
          <div
            key={app.key}
            className={activeApp === app.key ? 'block h-full' : 'hidden'}
          >
            <iframe
              src={app.route}
              className="w-full h-full border-0"
              title={app.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
