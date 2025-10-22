import type { AppUnitProps } from '@/apps/types';

export default function AffiliateNetworkEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-mlm" aria-label="Affiliate Network">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Affiliate Network</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Affiliate Network Content">Coming soon</div>
    </section>
  );
}
