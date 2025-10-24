import type { AppUnitProps } from '@/apps/types';

export default function YallbraryPanel({}: AppUnitProps) {
  return (
    <div data-testid="panel-yallbrary" aria-label="Yallbrary Panel" className="p-4">
      <h3 className="text-lg font-medium mb-4">Pinned Apps</h3>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">No apps pinned yet</p>
      </div>
    </div>
  );
}
