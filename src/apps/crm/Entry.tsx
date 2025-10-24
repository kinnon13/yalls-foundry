import type { AppUnitProps } from '@/apps/types';
import { Button } from '@/components/ui/button';
import { useSectionAI } from '@/lib/shared/hooks/useSectionAI';

export default function CrmEntry({ contextType }: AppUnitProps) {
  const { execute, showNudge, isLoading, hasCapability } = useSectionAI();

  const handlePredictChurn = async () => {
    const result = await execute('predict.churn', { customers: 150 });
    if (result.result) showNudge(result.result);
  };

  return (
    <section data-testid="app-crm" aria-label="CRM" className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">CRM</h2>
        <small className="text-muted-foreground">{contextType}</small>
      </header>
      <div role="region" aria-label="CRM Content" className="space-y-4">
        <p className="text-muted-foreground">Customer relationship management</p>
        
        <Button 
          onClick={handlePredictChurn}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Analyzing...' : 'Predict Customer Churn (Business)'}
        </Button>
        
        {!hasCapability('predict.churn') && (
          <p className="text-xs text-muted-foreground">
            * Upgrade to Business role to unlock AI churn prediction
          </p>
        )}
      </div>
    </section>
  );
}
