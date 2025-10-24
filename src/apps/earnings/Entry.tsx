import type { AppUnitProps } from '@/apps/types';
import { Button } from '@/components/ui/button';
import { useSectionAI } from '@/lib/shared/hooks/useSectionAI';

export default function EarningsEntry({ contextType }: AppUnitProps) {
  const { execute, showNudge, isLoading, hasCapability } = useSectionAI();

  const handleForecast = async () => {
    const result = await execute('forecast.revenue', { period: '30 days' });
    if (result.result) showNudge(result.result);
  };

  return (
    <section data-testid="app-earnings" aria-label="Earnings" className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Earnings</h2>
        <small className="text-muted-foreground">{contextType}</small>
      </header>
      <div role="region" aria-label="Earnings Content" className="space-y-4">
        <p className="text-muted-foreground">Track your revenue and payouts</p>
        
        <Button 
          onClick={handleForecast}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Forecasting...' : 'Forecast Revenue (Business)'}
        </Button>
        
        {!hasCapability('forecast.revenue') && (
          <p className="text-xs text-muted-foreground">
            * Upgrade to Business role to unlock AI revenue forecasting
          </p>
        )}
      </div>
    </section>
  );
}
