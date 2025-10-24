import { useEffect } from 'react';
import type { AppUnitProps } from '@/apps/types';
import { Button } from '@/components/ui/button';
import { useSectionAI } from '@/lib/shared/hooks/useSectionAI';

export default function DiscoverEntry({ contextType }: AppUnitProps) {
  const { execute, showNudge, isLoading, hasCapability } = useSectionAI();

  // Auto-show AI suggestion on mount (user tier)
  useEffect(() => {
    if (hasCapability('suggest.follow')) {
      execute('suggest.follow', {}).then(result => {
        if (result.result) showNudge(result.result);
      });
    }
  }, []);

  return (
    <section data-testid="app-discover" aria-label="Discover" className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Discover</h2>
        <small className="text-muted-foreground">{contextType}</small>
      </header>
      <div role="region" aria-label="Discover Content" className="space-y-4">
        <p className="text-muted-foreground">Find new creators and content</p>
        
        <Button 
          onClick={() => execute('suggest.follow', {})}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Getting suggestions...' : 'Get AI Follow Suggestions'}
        </Button>
      </div>
    </section>
  );
}
