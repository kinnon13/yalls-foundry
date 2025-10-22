import type { AppUnitProps } from '@/apps/types';

export default function CartEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-cart" aria-label="Cart">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Cart</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Cart Content">Coming soon</div>
    </section>
  );
}
