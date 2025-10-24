import type { AppUnitProps } from '@/apps/types';

export default function YallsSocialPanel({}: AppUnitProps) {
  return (
    <div data-testid="panel-yalls-social" aria-label="Yalls Social Panel" className="p-4">
      <h3 className="text-lg font-medium mb-4">Social Feed</h3>
      <p className="text-sm text-muted-foreground">Quick access to trending posts</p>
    </div>
  );
}
