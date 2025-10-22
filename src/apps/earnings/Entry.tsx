import type { AppUnitProps } from '@/apps/types';

export default function EarningsEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-earnings" aria-label="Earnings">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Earnings</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Earnings Content">Coming soon</div>
    </section>
  );
}
