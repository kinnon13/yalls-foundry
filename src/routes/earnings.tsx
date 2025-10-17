/**
 * Earnings Dashboard - MLM/Commissions + Membership Tiers
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Award } from 'lucide-react';

export default function Earnings() {
  const { data: earnings } = useQuery({
    queryKey: ['earnings-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Mock data since commissions/memberships tables not implemented yet
      return {
        pending: 25000,
        paid: 150000,
        accrued: 175000,
        membership: { tier: 'Free' },
        commissions: [],
      };
    },
  });

  const TIERS = [
    { name: 'Free', capture: 0, color: 'text-gray-500' },
    { name: 'Tier 1', capture: 2.5, color: 'text-blue-500', cost: 9.99 },
    { name: 'Tier 2', capture: 4, color: 'text-purple-500', cost: 29.99 },
  ];

  const currentTier = earnings?.membership?.tier || 'Free';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Earnings</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-2xl font-bold">
              ${((earnings?.pending || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Accrued</div>
            </div>
            <div className="text-2xl font-bold">
              ${((earnings?.accrued || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div className="text-sm text-muted-foreground">Paid</div>
            </div>
            <div className="text-2xl font-bold">
              ${((earnings?.paid || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-purple-500" />
              <div className="text-sm text-muted-foreground">Tier</div>
            </div>
            <Badge variant="outline">{currentTier}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Commission Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-500">60%</div>
              <div className="text-sm text-muted-foreground">Business Onboarder</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">25%</div>
              <div className="text-sm text-muted-foreground">Buyer</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">15%</div>
              <div className="text-sm text-muted-foreground">Seller</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Membership Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <Card key={tier.name} className={currentTier === tier.name ? 'border-primary' : ''}>
                <CardContent className="pt-6">
                  <h3 className={`text-lg font-bold ${tier.color}`}>{tier.name}</h3>
                  <div className="text-3xl font-bold my-4">
                    {tier.capture}%
                    <span className="text-sm text-muted-foreground ml-1">capture</span>
                  </div>
                  {tier.cost && (
                    <div className="text-muted-foreground mb-4">
                      ${tier.cost}/month
                    </div>
                  )}
                  {currentTier !== tier.name && tier.name !== 'Free' && (
                    <Button className="w-full">Upgrade</Button>
                  )}
                  {currentTier === tier.name && (
                    <Badge variant="outline" className="w-full justify-center">
                      Current
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
