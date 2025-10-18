/**
 * macOS-style Dock
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface DockApp {
  id: string;
  label: string;
  icon: LucideIcon;
  isOpen?: boolean;
  isMinimized?: boolean;
}

interface AppDockProps {
  apps: DockApp[];
  onAppClick: (appId: string) => void;
}

export function AppDock({ apps, onAppClick }: AppDockProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-background/40 backdrop-blur-2xl border border-border/50 rounded-2xl p-2 shadow-2xl">
        <div className="flex items-end gap-2">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => onAppClick(app.id)}
                className={cn(
                  "group relative w-14 h-14 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95",
                  "bg-gradient-to-br from-primary/20 to-primary/5 hover:from-primary/30 hover:to-primary/10",
                  "border border-border/50 hover:border-primary/50",
                  "flex items-center justify-center",
                  app.isOpen && "ring-2 ring-primary/50"
                )}
                aria-label={app.label}
              >
                <Icon className="w-7 h-7 text-foreground" />
                
                {/* Active indicator dot */}
                {app.isOpen && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg">
                    {app.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
