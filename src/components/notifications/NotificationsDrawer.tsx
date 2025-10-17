/**
 * Notifications Drawer with Lanes
 * Priority/Social/System segmentation with swipe-to-dismiss
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  body?: string;
  category: 'ai' | 'crm' | 'events' | 'orders' | 'social' | 'system';
  priority: number;
  read_at?: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsDrawer({ open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('notif_mark_all_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'All notifications marked as read' });
    },
    onError: () => {
      toast({ title: 'Failed to mark notifications as read', variant: 'destructive' });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('notif_mark_read', { p_ids: [id] });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Group by category with priority-based lanes
  const lanes = {
    priority: notifications.filter(n => n.priority >= 8 || n.category === 'system'),
    social: notifications.filter(n => n.priority < 8 && n.category === 'social'),
    system: notifications.filter(n => n.priority < 8 && ['events', 'orders', 'crm'].includes(n.category)),
  };

  if (!open) return null;

  return (
    <aside
      role="dialog"
      aria-label="Notifications"
      className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-background border-l shadow-2xl z-50 overflow-y-auto"
    >
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || notifications.filter(n => !n.read_at).length === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center text-muted-foreground">
          Loading notifications...
        </div>
      )}

      {/* Lanes */}
      {!isLoading && (
        <>
          {(['priority', 'social', 'system'] as const).map((lane) => (
            <section key={lane} className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {lane}
              </h3>
              <ul className="space-y-2">
                {lanes[lane].map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-lg border p-4 transition-opacity ${
                      n.read_at ? 'opacity-60' : 'bg-accent/5'
                    }`}
                    onClick={() => !n.read_at && markRead.mutate(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">{n.title}</div>
                        {n.body && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {n.body}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!n.read_at && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </li>
                ))}
                {lanes[lane].length === 0 && (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    No {lane} notifications
                  </div>
                )}
              </ul>
            </section>
          ))}
        </>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No notifications yet
        </div>
      )}
    </aside>
  );
}
