import type { AppUnitProps } from '@/apps/types';

export default function ListingsEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-listings" aria-label="Listings">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Listings</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Listings Content">Coming soon</div>
    </section>
  );
}
