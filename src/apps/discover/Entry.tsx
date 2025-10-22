import type { AppUnitProps } from '@/apps/types';

export default function DiscoverEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-discover" aria-label="Discover">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Discover</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Discover Content">Coming soon</div>
    </section>
  );
}
