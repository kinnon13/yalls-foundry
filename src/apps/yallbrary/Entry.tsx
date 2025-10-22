import type { AppUnitProps } from '@/apps/types';

export default function YallbraryEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-yallbrary" aria-label="Yallbrary">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Yallbrary</h2>
        <small>{contextType}</small>
      </header>
      <div role="region" aria-label="Yallbrary Content">
        Coming soon — connect to marketplace routes or index here.
      </div>
    </section>
  );
}
