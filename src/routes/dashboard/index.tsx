import { Outlet } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DashboardLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <div className="flex h-[calc(100vh-64px)]">
        {!isMobile && <DashboardSidebar />}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
