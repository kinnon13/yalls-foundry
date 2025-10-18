/**
 * Digest Preview Component
 * Shows grouped preview of notifications
 */

import React from 'react';
import type { NotificationLane, Notification } from '@/lib/adapters/notifications-types';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface DigestGroup {
  lane: NotificationLane;
  items: Notification[];
}

interface Props {
  groups: DigestGroup[];
  onSendTest: () => void;
  isLoading?: boolean;
}

const LANE_LABELS = {
  priority: 'Priority',
  social: 'Social',
  system: 'System',
};

export function DigestPreview({ groups, onSendTest, isLoading }: Props) {
  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Digest Preview</h3>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'notification' : 'notifications'} would be included
          </p>
        </div>
        <Button
          onClick={onSendTest}
          disabled={isLoading || totalCount === 0}
          size="sm"
        >
          <Mail className="h-4 w-4 mr-2" />
          Send me a test
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No unread notifications to preview
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.lane} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {LANE_LABELS[group.lane]} ({group.items.length})
              </h4>
              <ul role="list" className="space-y-2">
                {group.items.map((notif) => (
                  <NotificationItem key={notif.id} notification={notif} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
