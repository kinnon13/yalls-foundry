import type { AppUnitProps } from '@/apps/types';

export default function SettingsEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-settings" aria-label="Settings">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Settings</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Settings Content">Coming soon</div>
    </section>
  );
}
