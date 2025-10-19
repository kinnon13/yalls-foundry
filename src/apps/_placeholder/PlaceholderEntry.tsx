import type { AppUnitProps } from '@/lib/app-units/types';

export default function PlaceholderEntry({ contextType, contextId }: AppUnitProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
      <p className="text-muted-foreground">
        This app is under development for {contextType} context.
      </p>
    </div>
  );
}
