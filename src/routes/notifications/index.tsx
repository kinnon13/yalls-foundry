/**
 * Notifications Page
 * Bell icon notifications list with mark read
 */

import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No notifications yet</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              notif.read_at ? 'bg-background' : 'bg-accent/50'
            }`}
            onClick={() => !notif.read_at && markRead.mutate(notif.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{notif.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{notif.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notif.read_at && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
