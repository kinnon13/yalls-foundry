import type { AppUnitProps } from '@/apps/types';
import { Button } from '@/components/ui/button';
import { useSectionAI } from '@/lib/shared/hooks/useSectionAI';

export default function BusinessEntry({ contextType }: AppUnitProps) {
  const { execute, showNudge, isLoading, hasCapability, userRole } = useSectionAI();

  const handleMonetize = async () => {
    const result = await execute('monetize.ideas', { context: 'business_dashboard' });
    if (result.result) showNudge(result.result);
  };

  return (
    <section data-testid="app-business" aria-label="Business" className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Business Dashboard</h2>
        <small className="text-muted-foreground">{contextType} · Role: {userRole}</small>
      </header>
      <div role="region" aria-label="Business Content" className="space-y-4">
        <p className="text-muted-foreground">Manage your business operations</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleMonetize}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Analyzing...' : 'AI Business Ideas'}
          </Button>
          
          <Button 
            onClick={() => execute('forecast.revenue', {})}
            disabled={isLoading}
            variant="outline"
          >
            Revenue Forecast
          </Button>
        </div>
        
        {!hasCapability('monetize.ideas') && (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-medium">Unlock Business AI Features</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upgrade to Business role for AI-powered monetization ideas, churn prediction, and revenue forecasting
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
