/**
 * Notifications Page (Task 23)
 * Production-grade notification center with Mac polish
 */

import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { CheckCheck, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton, SkeletonList } from '@/components/system/Skeleton';

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-1 text-lg font-semibold">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">
            When you get notifications, they'll show up here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`group relative rounded-xl border p-4 transition-all hover:shadow-md ${
                notif.read_at
                  ? 'bg-background'
                  : 'bg-accent/30 border-primary/20'
              }`}
              onClick={() => !notif.read_at && markRead.mutate(notif.id)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold leading-tight">{notif.title}</h3>
                  {notif.body && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {notif.body}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!notif.read_at && (
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
