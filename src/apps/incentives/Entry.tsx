import type { AppUnitProps } from '@/apps/types';

export default function IncentivesEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-incentives" aria-label="Incentives">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Incentives</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Incentives Content">Coming soon</div>
    </section>
  );
}
