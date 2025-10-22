import type { AppUnitProps } from '@/apps/types';

export default function MessagesEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-messages" aria-label="Messages">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Messages</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Messages Content">Coming soon</div>
    </section>
  );
}
