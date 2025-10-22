import type { AppUnitProps } from '@/apps/types';

export default function NotificationsPanel({}: AppUnitProps) {
  return (
    <div data-testid="panel-notifications" className="p-3 text-sm">
      <div className="font-medium mb-2">Recent Notifications</div>
      <ul className="space-y-2 text-xs text-muted-foreground">
        <li>• No new notifications</li>
      </ul>
    </div>
  );
}
