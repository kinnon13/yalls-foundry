import type { AppUnitProps } from '@/apps/types';

export default function EventsEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-events" aria-label="Events">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Events</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Events Content">Coming soon</div>
    </section>
  );
}
