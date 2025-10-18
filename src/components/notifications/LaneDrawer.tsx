/**
 * Lane Drawer Component
 * Three-tab notification center with badge counts
 */

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCounts } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import type { NotificationLane } from '@/ports/notifications';
import { Button } from '@/components/ui/button';
import { CheckCheck, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Props {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LaneDrawer({ userId, open, onOpenChange }: Props) {
  const [activeLane, setActiveLane] = useState<NotificationLane>('priority');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const { counts } = useNotificationCounts();
  const { notifications, isLoading, markRead, markAllRead } = useNotifications(activeLane);

  const unreadInLane = notifications.filter(n => !n.read_at);

  const handleMarkSelectedRead = () => {
    if (selected.size > 0) {
      markRead.mutate(Array.from(selected));
      setSelected(new Set());
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
      className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] bg-background rounded-lg shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="notifications-title" className="text-xl font-semibold">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings/notifications')}
              aria-label="Notification settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label="Close notifications"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeLane} onValueChange={(v) => setActiveLane(v as NotificationLane)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b" role="tablist">
            <TabsTrigger
              value="priority"
              className="relative"
              role="tab"
              aria-selected={activeLane === 'priority'}
              aria-controls="priority-panel"
            >
              Priority
              {counts && counts.priority > 0 && (
                <span
                  className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground"
                  aria-live="polite"
                  aria-label={`${counts.priority} unread priority notifications`}
                >
                  {counts.priority}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="relative"
              role="tab"
              aria-selected={activeLane === 'social'}
              aria-controls="social-panel"
            >
              Social
              {counts && counts.social > 0 && (
                <span
                  className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground"
                  aria-live="polite"
                  aria-label={`${counts.social} unread social notifications`}
                >
                  {counts.social}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="relative"
              role="tab"
              aria-selected={activeLane === 'system'}
              aria-controls="system-panel"
            >
              System
              {counts && counts.system > 0 && (
                <span
                  className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground"
                  aria-live="polite"
                  aria-label={`${counts.system} unread system notifications`}
                >
                  {counts.system}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Actions */}
          {unreadInLane.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
              {selected.size > 0 ? (
                <>
                  <span className="text-sm text-muted-foreground">{selected.size} selected</span>
                  <Button variant="ghost" size="sm" onClick={handleMarkSelectedRead}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark selected read
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <TabsContent
            value={activeLane}
            role="tabpanel"
            id={`${activeLane}-panel`}
            className="flex-1 overflow-y-auto p-4 mt-0"
          >
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No notifications in {activeLane}
              </div>
            ) : (
              <ul role="list" className="space-y-2">
                {notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif as any}
                    selected={selected.has(notif.id)}
                    onToggleSelect={() => toggleSelect(notif.id)}
                    onMarkRead={() => markRead.mutate([notif.id])}
                  />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
