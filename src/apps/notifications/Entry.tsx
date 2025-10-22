import type { AppUnitProps } from '@/apps/types';

export default function NotificationsEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-notifications" aria-label="Notifications">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Notifications</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Notifications Content">Coming soon</div>
    </section>
  );
}
