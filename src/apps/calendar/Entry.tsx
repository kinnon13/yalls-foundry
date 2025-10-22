import type { AppUnitProps } from '@/apps/types';

export default function CalendarEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-calendar" aria-label="Calendar">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Calendar</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Calendar Content">Coming soon</div>
    </section>
  );
}
