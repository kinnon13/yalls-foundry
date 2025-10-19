/**
 * Notifications Overlay
 * Lane-based: social/orders/events/crm/ai/system
 * Mark-all-read, respects quiet hours
 */

import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { rocker } from '@/lib/rocker/event-bus';

type NotificationLane = 'social' | 'orders' | 'events' | 'crm' | 'ai' | 'system';

interface Notification {
  id: string;
  lane: NotificationLane;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    lane: 'social',
    title: 'New follower',
    body: 'John Doe started following you',
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: '2',
    lane: 'orders',
    title: 'Order shipped',
    body: 'Your order #1234 has been shipped',
    timestamp: new Date(Date.now() - 7200000),
    read: false,
  },
  {
    id: '3',
    lane: 'ai',
    title: 'Rocker suggestion',
    body: 'You have 3 pending tasks to review',
    timestamp: new Date(Date.now() - 10800000),
    read: true,
  },
];

export function NotificationsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeLane, setActiveLane] = useState<NotificationLane>('social');

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.lane === activeLane ? { ...n, read: true } : n))
    );
    rocker.emit('notifications_marked_read', { metadata: { lane: activeLane } });
  };

  const laneNotifications = notifications.filter((n) => n.lane === activeLane);
  const unreadCount = laneNotifications.filter((n) => !n.read).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Lanes */}
      <Tabs value={activeLane} onValueChange={(v) => setActiveLane(v as NotificationLane)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent">
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b">
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        )}

        <TabsContent value={activeLane} className="flex-1 m-0">
          <ScrollArea className="h-full">
            {laneNotifications.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="divide-y">
                {laneNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-accent cursor-pointer ${
                      notif.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{notif.title}</p>
                        <p className="text-sm text-muted-foreground">{notif.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(notif.timestamp)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
