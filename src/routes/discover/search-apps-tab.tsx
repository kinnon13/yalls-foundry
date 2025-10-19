/**
 * Apps Tab Content for Search
 */

import { AppWindow, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface App {
  id: string;
  name: string;
  description: string;
  installed: boolean;
  icon: string;
}

interface AppsTabContentProps {
  apps: App[];
  onOpen: (appId: string) => void;
  onInstall: (appId: string) => void;
  onPin: (appId: string) => void;
}

export function AppsTabContent({ apps, onOpen, onInstall, onPin }: AppsTabContentProps) {
  if (apps.length === 0) {
    return (
      <div className="text-center py-12">
        <AppWindow className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">No apps found</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Try searching for: orders, calendar, marketplace, messages, earnings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <Card key={app.id} className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="text-4xl flex-shrink-0">
              {app.icon}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{app.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {app.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {app.installed ? (
                <Button size="sm" onClick={() => onOpen(app.id)}>
                  Open
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onInstall(app.id)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Install
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => onPin(app.id)}>
                Pin to Dock
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
