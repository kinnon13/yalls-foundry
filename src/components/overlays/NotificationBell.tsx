/**
 * NotificationBell - Global notifications panel
 * Reads from notifications table via RPC
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  lane: string;
  payload: any;
  created_at: string;
  read_at: string | null;
}

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return (data || []).map((n: any) => ({
        id: n.id,
        user_id: n.user_id || n.created_by || '',
        lane: n.lane || n.category || 'general',
        payload: n.payload || {},
        created_at: n.created_at,
        read_at: n.read_at || null
      })) as Notification[];
    }
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.rpc('notif_mark_read', { p_ids: ids });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async (lane: string) => {
      const { error } = await supabase.rpc('notif_mark_all_read', { p_lane: lane });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate([id]);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate('all');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllRead}
              className="h-auto p-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                onClick={() => !notif.read_at && handleMarkRead(notif.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-medium text-muted-foreground">
                    {notif.lane}
                  </span>
                  {!notif.read_at && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm">
                  {JSON.stringify(notif.payload)}
                </p>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(notif.created_at), 'PPp')}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
