import type { AppUnitProps } from '@/apps/types';
import { Button } from '@/components/ui/button';
import { useSectionAI } from '@/lib/shared/hooks/useSectionAI';

export default function MarketplaceEntry({ contextType }: AppUnitProps) {
  const { execute, showNudge, isLoading, hasCapability } = useSectionAI();

  const handleMonetizeIdeas = async () => {
    const result = await execute('monetize.ideas', { context: 'marketplace' });
    if (result.result) showNudge(result.result);
  };

  return (
    <section data-testid="app-marketplace" aria-label="Marketplace" className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Marketplace</h2>
        <small className="text-muted-foreground">{contextType}</small>
      </header>
      <div role="region" aria-label="Marketplace Content" className="space-y-4">
        <p className="text-muted-foreground">Browse products and services</p>
        
        <Button 
          onClick={handleMonetizeIdeas}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Analyzing...' : 'Get Monetization Ideas (Creator/Business)'}
        </Button>
        
        {!hasCapability('monetize.ideas') && (
          <p className="text-xs text-muted-foreground">
            * Upgrade to Creator or Business role to unlock AI monetization features
          </p>
        )}
      </div>
    </section>
  );
}
