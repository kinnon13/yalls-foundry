import type { AppUnitProps } from '@/apps/types';
import { Suspense, lazy } from 'react';

const Overview = lazy(() => import('@/routes/dashboard/modules/Overview'));

export default function OverviewEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-overview" aria-label="Overview">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Overview</h2><small>{contextType}</small>
      </header>
      <div role="region" aria-label="Overview Content">
        <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
          <Overview />
        </Suspense>
      </div>
    </section>
  );
}
