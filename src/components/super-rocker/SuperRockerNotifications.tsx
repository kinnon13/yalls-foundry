import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  payload: {
    text: string;
    source?: string;
    channel?: string;
  };
  read_at: string | null;
  created_at: string;
}

export function SuperRockerNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('rocker_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rocker_notifications'
        },
        (payload) => {
          console.log('[Rocker Notifications] New:', payload.new);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rocker_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []).map(n => ({
        ...n,
        payload: typeof n.payload === 'object' && n.payload ? n.payload as any : { text: String(n.payload || '') }
      })));
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rocker_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadNotifications();
    } catch (error: any) {
      toast({
        title: 'Failed to mark as read',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rocker_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadNotifications();
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('rocker_notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);

      if (error) throw error;
      await loadNotifications();
      toast({ title: 'All notifications marked as read' });
    } catch (error: any) {
      toast({
        title: 'Failed to mark all as read',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-2 pr-4">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 ${!notif.read_at ? 'border-primary bg-accent/50' : 'bg-muted/30'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm whitespace-pre-wrap">
                    {notif.payload.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {notif.payload.source || 'rocker'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {notif.payload.channel || 'web'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1 shrink-0">
                  {!notif.read_at && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => markAsRead(notif.id)}
                      title="Mark as read"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => deleteNotification(notif.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {notifications.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
              <p className="text-sm mt-1">Rocker will notify you here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
