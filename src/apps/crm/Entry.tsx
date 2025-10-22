import type { AppUnitProps } from '@/apps/types';

export default function CrmEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-crm" aria-label="CRM">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>CRM</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="CRM Content">Coming soon</div>
    </section>
  );
}
