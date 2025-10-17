/**
 * Discover - Browse & explore public content
 */

import { useState } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { SEOHelmet } from '@/lib/seo/helmet';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, Sparkles } from 'lucide-react';

type DiscoverTab = 'trending' | 'latest' | 'for_you';

export default function Discover() {
  const [tab, setTab] = useState<DiscoverTab>('trending');

  return (
    <>
      <SEOHelmet 
        title="Discover - Y'alls.ai" 
        description="Explore trending content, latest updates, and personalized recommendations"
      />
      <GlobalHeader />
      
      <main className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Discover</h1>
              <p className="text-muted-foreground">
                Explore trending content and discover new connections
              </p>
            </div>

            <SegmentedControl
              value={tab}
              onChange={(value) => setTab(value as DiscoverTab)}
              options={[
                { value: 'trending', label: 'Trending', icon: <TrendingUp className="h-4 w-4" /> },
                { value: 'latest', label: 'Latest', icon: <Clock className="h-4 w-4" /> },
                { value: 'for_you', label: 'For You', icon: <Sparkles className="h-4 w-4" /> }
              ]}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-fade-in hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tab === 'trending' && 'Trending content will appear here'}
                      {tab === 'latest' && 'Latest posts will appear here'}
                      {tab === 'for_you' && 'Personalized recommendations will appear here'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
