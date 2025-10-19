/**
 * Interest-Based Feed - Shows marketplace items based on user interests
 */

import { MarketplaceSuggestions } from '@/components/marketplace/MarketplaceSuggestions';
import { SocialSuggestions } from '@/components/social/SocialSuggestions';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function InterestBasedFeed() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Discover</h2>
        <p className="text-muted-foreground mb-6">
          Personalized recommendations based on your interests
        </p>

        <Tabs defaultValue="shop" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shop">Shop</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-6">
            <MarketplaceSuggestions limit={12} />
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">People You May Know</h3>
                <SocialSuggestions kind="friend" limit={6} variant="full" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Creators to Follow</h3>
                <SocialSuggestions kind="creator" limit={6} variant="full" />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Businesses Near You</h3>
                <SocialSuggestions kind="business" limit={6} variant="full" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
