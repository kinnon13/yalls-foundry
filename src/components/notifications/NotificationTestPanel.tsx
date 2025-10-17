/**
 * Notification Test Panel
 * Dev utility to generate test notifications
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertCircle, Heart, ShoppingCart, Info } from 'lucide-react';
import { useNotificationTest } from '@/hooks/useNotifications';

const TEST_TYPES = [
  { kind: 'mention', label: 'Mention', icon: Bell, lane: 'priority' },
  { kind: 'order', label: 'Order', icon: ShoppingCart, lane: 'priority' },
  { kind: 'follow', label: 'Follow', icon: Heart, lane: 'social' },
  { kind: 'like', label: 'Like', icon: Heart, lane: 'social' },
  { kind: 'repost', label: 'Repost', icon: Bell, lane: 'social' },
  { kind: 'system', label: 'System', icon: Info, lane: 'system' }
];

export function NotificationTestPanel() {
  const { mutate: createTest, isPending } = useNotificationTest();

  const isDev = import.meta.env.DEV;

  if (!isDev) return null;

  return (
    <Card className="border-dashed border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertCircle className="h-5 w-5" />
          Dev: Test Notifications
        </CardTitle>
        <CardDescription>
          Generate test notifications to verify lanes and UI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {TEST_TYPES.map(({ kind, label, icon: Icon, lane }) => (
            <Button
              key={kind}
              variant="outline"
              size="sm"
              onClick={() => createTest(kind)}
              disabled={isPending}
              className="justify-start"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
              <span className="ml-auto text-xs text-muted-foreground">{lane}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
