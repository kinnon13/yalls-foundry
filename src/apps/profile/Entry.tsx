import type { AppUnitProps } from '@/apps/types';

export default function ProfileEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-profile" aria-label="Profile">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Profile</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Profile Content">Coming soon</div>
    </section>
  );
}
