import type { AppUnitProps } from '@/apps/types';

export default function MarketplaceEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-marketplace" aria-label="Marketplace">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Marketplace</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Marketplace Content">Coming soon</div>
    </section>
  );
}
