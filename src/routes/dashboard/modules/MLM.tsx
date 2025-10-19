/**
 * MLM Dashboard Module - Complete analytics view
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommissionDashboard } from '@/components/mlm/CommissionDashboard';
import { TreeVisualization } from '@/components/mlm/TreeVisualization';
import { Leaderboard } from '@/components/mlm/Leaderboard';
import { Network, BarChart3, Users } from 'lucide-react';

export default function MLMModule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Affiliate Network</h1>
        <p className="text-muted-foreground mt-1">
          Track your downline, commissions, and team performance
        </p>
      </div>

      <CommissionDashboard />

      <Tabs defaultValue="tree" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tree" className="gap-2">
            <Network className="h-4 w-4" />
            My Network
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tree" className="mt-6">
          <TreeVisualization />
        </TabsContent>
        
        <TabsContent value="leaderboard" className="mt-6">
          <Leaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
