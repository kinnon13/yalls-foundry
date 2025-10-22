import type { AppUnitProps } from '@/apps/types';

export default function BusinessEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-business" aria-label="Business">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Business</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Business Content">Coming soon</div>
    </section>
  );
}
