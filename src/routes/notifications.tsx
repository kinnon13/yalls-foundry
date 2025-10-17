/**
 * Notifications Route
 * Three-lane notification inbox (Priority, Social, System)
 */

import React, { useState } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, Bell, Heart, Settings as SettingsIcon } from 'lucide-react';
import { useNotifications, useNotificationCounts } from '@/hooks/useNotifications';
import { NotificationTestPanel } from '@/components/notifications/NotificationTestPanel';
import { Link } from 'react-router-dom';
import type { NotificationLane } from '@/lib/adapters/notifications-types';

export default function NotificationsPage() {
  const [activeLane, setActiveLane] = useState<NotificationLane>('priority');
  const { data: counts } = useNotificationCounts();
  
  const { 
    notifications, 
    isLoading, 
    markRead, 
    markAllRead 
  } = useNotifications(activeLane);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organized by priority, social, and system
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/settings/notifications">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Preferences
            </Link>
          </Button>
        </div>

        {/* Test Panel (dev only) */}
        <NotificationTestPanel />

        {/* Tabs */}
        <Tabs value={activeLane} onValueChange={(v) => setActiveLane(v as NotificationLane)}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="priority" className="gap-2">
              <Bell className="h-4 w-4" />
              Priority
              {counts && counts.priority > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {counts.priority}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Heart className="h-4 w-4" />
              Social
              {counts && counts.social > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {counts.social}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              System
              {counts && counts.system > 0 && (
                <Badge variant="outline" className="ml-1">
                  {counts.system}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {['priority', 'social', 'system'].map((lane) => (
            <TabsContent key={lane} value={lane} className="space-y-4">
              {/* Mark All Read */}
              {unreadCount > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllRead()}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all read
                  </Button>
                </div>
              )}

              {/* Notifications List */}
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No notifications in this lane</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        notif.read_at
                          ? 'bg-card/50'
                          : 'bg-card border-primary/20'
                      }`}
                      onClick={() => !notif.read_at && markRead([notif.id])}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">
                              {notif.title}
                            </h3>
                            {!notif.read_at && (
                              <div className="h-2 w-2 bg-primary rounded-full" />
                            )}
                          </div>
                          {notif.body && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notif.body}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                            <span className="capitalize">{notif.type}</span>
                          </div>
                        </div>
                        {notif.link && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={notif.link}>View →</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
