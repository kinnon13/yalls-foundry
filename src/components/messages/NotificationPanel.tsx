import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  lane: string;
  payload: Record<string, any>;
  created_at: string;
  read_at: string | null;
  user_id: string;
}

export function NotificationPanel() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', session?.userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', session?.userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!session?.userId,
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.rpc('notif_mark_read' as any, { p_ids: ids });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async (lane?: string) => {
      const { error } = await supabase.rpc('notif_mark_all_read' as any, { p_lane: lane || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const lanes = Array.from(new Set(notifications.map(n => n.lane)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate(undefined)}
            disabled={markAllRead.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {lanes.map(lane => (
            <TabsTrigger key={lane} value={lane}>
              {lane}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications yet
            </p>
          ) : (
            notifications.map(notif => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={() => markRead.mutate([notif.id])}
              />
            ))
          )}
        </TabsContent>

        {lanes.map(lane => (
          <TabsContent key={lane} value={lane} className="space-y-2">
            {notifications
              .filter(n => n.lane === lane)
              .map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkRead={() => markRead.mutate([notif.id])}
                />
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const isUnread = !notification.read_at;

  return (
    <div
      className={`p-4 rounded-lg border ${
        isUnread ? 'bg-accent/50' : 'bg-card'
      } hover:bg-accent/30 transition-colors`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">
            {notification.payload.title || notification.lane}
          </p>
          <p className="text-xs text-muted-foreground">
            {notification.payload.message || JSON.stringify(notification.payload)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {isUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkRead}
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
