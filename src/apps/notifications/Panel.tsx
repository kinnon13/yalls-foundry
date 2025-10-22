import type { AppUnitProps } from '@/apps/types';

export default function NotificationsPanel({}: AppUnitProps) {
  return (
    <div data-testid="panel-notifications" className="p-3">
      <h3 className="text-sm font-semibold mb-2">Notifications</h3>
      <ul className="space-y-2 text-xs text-muted-foreground">
        <li>• No new notifications</li>
      </ul>
    </div>
  );
}
