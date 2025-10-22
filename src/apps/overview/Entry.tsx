import type { AppUnitProps } from '@/apps/types';

export default function OverviewEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-overview" aria-label="Owner HQ">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Owner HQ</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Owner HQ Content">Coming soon</div>
    </section>
  );
}
