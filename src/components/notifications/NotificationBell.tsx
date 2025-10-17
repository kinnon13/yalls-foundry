/**
 * Notification Bell - Header dropdown with swipeable lanes
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const LANES = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'orders', label: 'Orders' },
  { id: 'events', label: 'Events' },
  { id: 'crm', label: 'CRM' },
  { id: 'ai', label: 'AI' },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [activeLane, setActiveLane] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from('notification_receipts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', activeLane],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('notification_receipts')
        .select('*, notifications(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activeLane !== 'all') {
        // Filter in JS since we can't join filter in the query
        const { data } = await query;
        return (data || []).filter((n: any) => n.notifications?.category === activeLane);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await supabase.rpc('notif_mark_read', { p_ids: ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async (lane: string) => {
      await supabase.rpc('notif_mark_all_read', { p_lane: lane });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Notifications</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllReadMutation.mutate(activeLane)}
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>

        <Tabs value={activeLane} onValueChange={setActiveLane}>
          <TabsList className="w-full justify-start rounded-none border-b">
            {LANES.map((lane) => (
              <TabsTrigger key={lane.id} value={lane.id}>
                {lane.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {LANES.map((lane) => (
            <TabsContent key={lane.id} value={lane.id} className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b hover:bg-accent cursor-pointer ${
                      !notif.read_at ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => {
                      if (!notif.read_at) {
                        markReadMutation.mutate([notif.id]);
                      }
                      if (notif.notifications.link) {
                        navigate(notif.notifications.link);
                        setOpen(false);
                      }
                    }}
                  >
                    <div className="font-medium">{notif.notifications.title}</div>
                    {notif.notifications.body && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {notif.notifications.body}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
