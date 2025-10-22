import type { AppUnitProps } from '@/apps/types';

export default function FarmOpsEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-farm-ops" aria-label="Farm Ops">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Farm Ops</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Farm Ops Content">Coming soon</div>
    </section>
  );
}
