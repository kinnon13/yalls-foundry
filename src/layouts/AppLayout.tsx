/**
 * App Layout
 * Shared layout with sidebar navigation
 */

import { Outlet } from 'react-router-dom';
import { Nav } from '@/components/navigation/Nav';

export function AppLayout() {
  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen">
      <aside className="border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-6">Super Andy</h2>
          <Nav />
        </div>
      </aside>
      <main className="flex flex-col">
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
