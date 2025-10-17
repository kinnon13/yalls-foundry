/**
 * Notification Bell Icon (compact version for header)
 * Production UI: Mac efficiency + TikTok feel + Amazon capabilities
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/design/components/Button';
import { Badge } from '@/design/components/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { tokens } from '@/design/tokens';

type Lane = 'inbox' | 'digest' | 'marketing' | 'ops';

interface Notification {
  id: string;
  lane: Lane;
  kind: string;
  title: string;
  body: string | null;
  status: 'queued' | 'sent' | 'failed' | 'read';
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLane, setActiveLane] = useState<Lane>('inbox');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications with realtime
  const { data: notifications = [] } = useQuery({
    queryKey: ['notification_receipts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notification_receipts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Count unread per lane
  const unreadCounts = notifications.reduce((acc, n) => {
    if (n.status !== 'read') {
      acc[n.lane] = (acc[n.lane] || 0) + 1;
    }
    return acc;
  }, {} as Record<Lane, number>);

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Mark read mutation
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc('notif_mark_read', { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_receipts'] });
    },
  });

  // Mark all read mutation
  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc('notif_mark_all_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_receipts'] });
      toast({ title: 'All notifications marked as read' });
    },
  });

  const laneNotifications = notifications.filter(n => n.lane === activeLane);

  if (!isOpen) {
    return (
      <div style={{ position: 'relative' }}>
        <Button
          variant="ghost"
          size="m"
          onClick={() => setIsOpen(true)}
          aria-label={`${totalUnread} unread notifications`}
        >
          <Bell size={16} />
          {totalUnread > 0 && (
            <Badge variant="danger">{totalUnread > 99 ? '99+' : totalUnread}</Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 64,
      right: tokens.space.m,
      width: 400,
      maxHeight: 600,
      background: tokens.color.bg.dark,
      border: `1px solid ${tokens.color.text.secondary}40`,
      borderRadius: tokens.radius.m,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      zIndex: tokens.zIndex.modal,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: tokens.space.m,
        borderBottom: `1px solid ${tokens.color.text.secondary}40`,
      }}>
        <h3 style={{
          fontSize: tokens.typography.size.l,
          fontWeight: tokens.typography.weight.bold,
          color: tokens.color.text.primary,
        }}>
          Notifications
        </h3>
        <div style={{ display: 'flex', gap: tokens.space.xs }}>
          <Button
            variant="ghost"
            size="s"
            onClick={() => markAllRead.mutate()}
            disabled={totalUnread === 0}
          >
            Mark all read
          </Button>
          <Button variant="ghost" size="s" onClick={() => setIsOpen(false)}>
            ×
          </Button>
        </div>
      </div>

      <Tabs value={activeLane} onValueChange={(v) => setActiveLane(v as Lane)}>
        <TabsList style={{ width: '100%', justifyContent: 'space-around', padding: tokens.space.s }}>
          {(['inbox', 'digest', 'marketing', 'ops'] as Lane[]).map(lane => (
            <TabsTrigger key={lane} value={lane} style={{ position: 'relative' }}>
              {lane}
              {unreadCounts[lane] > 0 && (
                <Badge variant="danger">{unreadCounts[lane]}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {(['inbox', 'digest', 'marketing', 'ops'] as Lane[]).map(lane => (
          <TabsContent key={lane} value={lane} style={{ maxHeight: 480, overflowY: 'auto', padding: 0 }}>
            {laneNotifications.length === 0 ? (
              <div style={{ padding: tokens.space.xl, textAlign: 'center', color: tokens.color.text.secondary }}>
                No {lane} notifications
              </div>
            ) : (
              laneNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => notif.status !== 'read' && markRead.mutate(notif.id)}
                  style={{
                    padding: tokens.space.m,
                    borderBottom: `1px solid ${tokens.color.text.secondary}20`,
                    cursor: notif.status !== 'read' ? 'pointer' : 'default',
                    opacity: notif.status === 'read' ? 0.6 : 1,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.color.bg.light;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    fontSize: tokens.typography.size.m,
                    fontWeight: tokens.typography.weight.semibold,
                    color: tokens.color.text.primary,
                    marginBottom: tokens.space.xxs,
                  }}>
                    {notif.title}
                  </div>
                  {notif.body && (
                    <div style={{
                      fontSize: tokens.typography.size.s,
                      color: tokens.color.text.secondary,
                      marginBottom: tokens.space.xs,
                    }}>
                      {notif.body}
                    </div>
                  )}
                  <div style={{
                    fontSize: tokens.typography.size.xs,
                    color: tokens.color.text.muted,
                  }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
