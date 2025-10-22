import type { AppUnitProps } from '@/apps/types';

export default function OrdersEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-orders" aria-label="Orders">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Orders</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Orders Content">Coming soon</div>
    </section>
  );
}
