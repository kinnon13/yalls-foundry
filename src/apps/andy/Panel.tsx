import type { AppUnitProps } from '@/apps/types';

export default function AndyPanel({}: AppUnitProps) {
  return (
    <div data-testid="panel-andy" className="p-3 text-sm">
      Andy mini-panel — quick actions soon
    </div>
  );
}
