import type { AppUnitProps } from '@/apps/types';

export default function ProducerEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-producer" aria-label="Producer">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Producer</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Producer Content">Coming soon</div>
    </section>
  );
}
