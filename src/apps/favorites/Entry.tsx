import type { AppUnitProps } from '@/apps/types';

export default function FavoritesEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-favorites" aria-label="Favorites">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Favorites</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Favorites Content">Coming soon</div>
    </section>
  );
}
