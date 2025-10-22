import type { AppUnitProps } from '@/apps/types';

export default function EntitiesEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-entities" aria-label="Entities">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Entities</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Entities Content">Coming soon</div>
    </section>
  );
}
