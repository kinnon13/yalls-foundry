import type { AppUnitProps } from '@/apps/types';

export default function ActivityEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-activity" aria-label="AI Activity">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>AI Activity</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="AI Activity Content">Coming soon</div>
    </section>
  );
}
