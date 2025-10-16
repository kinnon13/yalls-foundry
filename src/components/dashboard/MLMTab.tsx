/**
 * Dashboard MLM Tab (Private)
 * User's personal MLM stats, referral link, commissions, and network tree
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Award, Copy, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useSession } from '@/lib/auth/context';
import { getMyMLMStats, getMyCommissions } from '@/lib/mlm/service.supabase';
import { formatCents, getRankBadgeClass } from '@/entities/mlm';
import { toast } from 'sonner';

export function MLMTab() {
  const { session } = useSession();

  const { data: mlmStats } = useQuery({
    queryKey: ['mlm-stats'],
    queryFn: getMyMLMStats,
    enabled: !!session?.userId,
  });

  const { data: commissions } = useQuery({
    queryKey: ['recent-commissions'],
    queryFn: () => getMyCommissions({ limit: 10 }),
    enabled: !!session?.userId,
  });

  const unpaidTotal = commissions?.filter(c => !c.paid_out).reduce((sum, c) => sum + c.amount_cents, 0) || 0;
  const referralLink = `${window.location.origin}/?ref=${session?.userId}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Current Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getRankBadgeClass(mlmStats?.current_rank || 'bronze')} variant="outline">
              {(mlmStats?.current_rank || 'bronze').toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Network Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlmStats?.total_downline_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {mlmStats?.direct_referrals_count || 0} direct referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pending Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(unpaidTotal)}</div>
            <p className="text-xs text-muted-foreground">Available for payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link to earn commissions from referrals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            You'll earn commissions when people sign up and make purchases using your link.
          </p>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Commissions
          </CardTitle>
          <CardDescription>Your latest earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <div className="space-y-2">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {commission.commission_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatCents(commission.amount_cents)}
                    </p>
                    <Badge variant={commission.paid_out ? 'default' : 'secondary'}>
                      {commission.paid_out ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No commissions yet. Start referring users to earn!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-muted-foreground/20">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Your MLM data is private. Only you and admins can see this information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}