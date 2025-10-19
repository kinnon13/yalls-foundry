/**
 * Dashboard Content - Main view for the shell
 * Shows Overview, MLM Tree, Earnings by default
 */

import { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Network, 
  DollarSign,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

const Overview = lazy(() => import('@/routes/dashboard/modules/Overview'));
const MLMModule = lazy(() => import('@/routes/dashboard/modules/MLM'));
const Earnings = lazy(() => import('@/routes/dashboard/modules/Earnings'));

export function DashboardContent() {
  return (
    <div className="h-full overflow-auto px-6 pt-2">
      <Tabs defaultValue="mlm" className="h-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="mlm" className="gap-2">
            <Network className="h-4 w-4" />
            Affiliate Network
          </TabsTrigger>
          <TabsTrigger value="earnings" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="h-full mt-0">
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <Overview />
          </Suspense>
        </TabsContent>

        <TabsContent value="mlm" className="h-full mt-0">
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <MLMModule />
          </Suspense>
        </TabsContent>

        <TabsContent value="earnings" className="h-full mt-0">
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <Earnings />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
