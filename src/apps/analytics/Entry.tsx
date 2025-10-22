import type { AppUnitProps } from '@/apps/types';

export default function AnalyticsEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-analytics" aria-label="Analytics">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Analytics</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Analytics Content">Coming soon</div>
    </section>
  );
}
