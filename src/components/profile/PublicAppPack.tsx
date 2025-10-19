/**
 * Public App Pack
 * Displays tappable tiles for public apps on entity profiles
 */

import { Calendar, ShoppingBag, Award, FileText, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePublicApps } from '@/hooks/usePublicApps';
import { usePinboard } from '@/library/pinboard';
import { rocker } from '@/lib/rocker/event-bus';
import { useNavigate } from 'react-router-dom';

interface PublicAppPackProps {
  entityId: string;
  entityName: string;
  entityType: string;
}

const APP_ICONS: Record<string, any> = {
  calendar: Calendar,
  events: Calendar,
  listings: ShoppingBag,
  incentives: Award,
  discover: TrendingUp,
  posts: FileText,
};

const APP_LABELS: Record<string, string> = {
  calendar: 'Calendar',
  events: 'Events',
  listings: 'Products',
  incentives: 'Incentives',
  discover: 'Posts',
  posts: 'About',
};

export function PublicAppPack({ entityId, entityName, entityType }: PublicAppPackProps) {
  const { apps, loading } = usePublicApps(entityId);
  const { pin, getPins } = usePinboard();
  const navigate = useNavigate();

  const handleAppClick = (appId: string) => {
    rocker.emit('public_app_open', {
      metadata: { entityId, appId, entityName },
    });
    navigate(`/?app=${appId}&entity=${entityId}`);
  };

  const handleAddToDashboard = (appId: string) => {
    pin(appId as any, entityType as any, entityId);
    rocker.emit('pin_added', {
      metadata: { appId, entityId, source: 'public_pack' },
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No public apps available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground">Public Apps</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            apps.forEach(app => handleAddToDashboard(app.appId));
          }}
        >
          Add All to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {apps.map((app) => {
          const Icon = APP_ICONS[app.appId] || FileText;
          const label = APP_LABELS[app.appId] || app.appId;
          const isPinned = getPins(entityId).some(p => p.appId === app.appId);

          return (
            <Card
              key={app.id}
              className="relative p-4 hover:bg-accent cursor-pointer transition-colors group"
              onClick={() => handleAppClick(app.appId)}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{label}</span>
                {app.config.count && (
                  <span className="text-xs text-muted-foreground">
                    {app.config.count} items
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToDashboard(app.appId);
                }}
              >
                {isPinned ? '✓' : '+'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
