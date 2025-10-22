import type { AppUnitProps } from '@/apps/types';

export default function RockerPanel({}: AppUnitProps) {
  return (
    <div data-testid="panel-rocker" className="p-3 text-sm">
      Rocker mini-panel — quick actions soon
    </div>
  );
}
