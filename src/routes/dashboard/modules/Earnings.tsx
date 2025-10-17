/**
 * Earnings Module - PR2.9
 * Tabs: Overview | Promotions | Pricing | Campaigns
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EarningsOverview } from './earnings/EarningsOverview';
import { PromotionsTab } from './earnings/PromotionsTab';
import { PricingTab } from './earnings/PricingTab';
import { CampaignsTab } from './earnings/CampaignsTab';

export function Earnings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">Revenue, promotions, pricing, and campaigns</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <EarningsOverview />
        </TabsContent>
        
        <TabsContent value="promotions">
          <PromotionsTab />
        </TabsContent>
        
        <TabsContent value="pricing">
          <PricingTab />
        </TabsContent>
        
        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
