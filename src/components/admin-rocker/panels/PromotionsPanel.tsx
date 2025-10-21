/**
 * Admin Rocker Promotions Panel
 * Campaign management and incentive tracking
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Plus, BarChart, Eye, Edit, Pause } from 'lucide-react';

export function PromotionsPanel() {
  const campaigns = [
    {
      id: 1,
      name: 'Spring Stallion Showcase',
      type: 'discount',
      status: 'active',
      discount: '15% off',
      redemptions: 234,
      goal: 500,
      revenue: '$12,450',
      endsIn: '12 days',
    },
    {
      id: 2,
      name: 'New Member Welcome',
      type: 'bonus',
      status: 'active',
      discount: '100 points',
      redemptions: 892,
      goal: 1000,
      revenue: 'N/A',
      endsIn: 'ongoing',
    },
    {
      id: 3,
      name: 'Summer Event Pass',
      type: 'package',
      status: 'scheduled',
      discount: '20% bundle',
      redemptions: 0,
      goal: 300,
      revenue: '$0',
      endsIn: 'starts in 5 days',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'paused': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotions & Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage promotional campaigns and incentives
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">+2 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,126</div>
            <p className="text-xs text-muted-foreground mt-1">+18% vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campaign Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground mt-1">+24% increase</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Campaign Manager
          </CardTitle>
          <CardDescription>
            Track performance and manage active promotions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.type} • {campaign.discount}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {campaign.redemptions} / {campaign.goal} redemptions
                      </span>
                    </div>
                    <Progress 
                      value={(campaign.redemptions / campaign.goal) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-sm font-medium">{campaign.revenue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium">{campaign.endsIn}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium capitalize">{campaign.type}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            AI Campaign Suggestions
          </CardTitle>
          <CardDescription>
            Proactive recommendations based on platform trends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Low engagement in farm operations</p>
            <p className="text-xs text-muted-foreground mt-1">
              Suggest a "Farm Management Tools" promotion with 20% off boarding services
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Create Campaign
            </Button>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">High stallion listing activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Consider a "Featured Stallion" package to boost premium listings
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Review Proposal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
