import type { AppUnitProps } from '@/apps/types';

export default function AndyEntry({ contextType }: AppUnitProps) {
  return (
    <div data-testid="app-andy" className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Super Andy <span className="opacity-60">({contextType})</span></h1>
      </header>
      <p className="text-muted-foreground">Chat & proactivity hub (overlay)</p>
    </div>
  );
}
