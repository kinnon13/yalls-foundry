import type { AppUnitProps } from '@/apps/types';

export default function AdminRockerPanel({}: AppUnitProps) {
  return (
    <div data-testid="panel-admin-rocker" className="p-3 text-sm">
      Admin Rocker mini — audits at a glance
    </div>
  );
}
