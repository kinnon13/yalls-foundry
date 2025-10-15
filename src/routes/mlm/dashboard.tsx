/**
 * MLM Dashboard Page
 * 
 * Personal MLM stats: rank, downline count, volume, earnings, referral link.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMyMLMStats,
  getMyRankProgress,
  getMyReferralLink,
  getMyCommissions,
} from '@/lib/mlm/service.supabase';
import { formatCents, getRankBadgeClass } from '@/entities/mlm';
import { Progress } from '@/components/ui/progress';

export default function MLMDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['mlm-stats'],
    queryFn: getMyMLMStats,
  });

  const { data: rankProgress } = useQuery({
    queryKey: ['mlm-rank-progress'],
    queryFn: getMyRankProgress,
  });

  const { data: referralLink } = useQuery({
    queryKey: ['mlm-referral-link'],
    queryFn: getMyReferralLink,
  });

  const { data: commissions } = useQuery({
    queryKey: ['mlm-commissions'],
    queryFn: () => getMyCommissions({ limit: 10 }),
  });

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">MLM Dashboard</h1>
        <p className="text-muted-foreground">Loading your network stats...</p>
      </div>
    );
  }

  const unpaidCommissions = commissions?.filter((c) => !c.paid_out) || [];
  const unpaidTotal = unpaidCommissions.reduce((sum, c) => sum + c.amount_cents, 0);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">MLM Dashboard</h1>
        <Badge className={getRankBadgeClass(stats.current_rank)} variant="outline">
          <Award className="w-4 h-4 mr-1" />
          {stats.current_rank.toUpperCase()}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_downline_count}</div>
            <p className="text-xs text-muted-foreground">
              {stats.direct_referrals_count} direct referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(stats.personal_volume_cents)}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(stats.team_volume_cents)}</div>
            <p className="text-xs text-muted-foreground">Downline total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(unpaidTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {unpaidCommissions.length} pending commissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rank Progress */}
      {rankProgress && rankProgress.next_rank && (
        <Card>
          <CardHeader>
            <CardTitle>Rank Progress</CardTitle>
            <CardDescription>
              Advance to {rankProgress.next_rank.toUpperCase()} rank
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(rankProgress.progress_percentage)}%</span>
              </div>
              <Progress value={rankProgress.progress_percentage} />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Personal Volume</span>
                <Badge variant={rankProgress.requirements_met.personal_volume ? 'default' : 'outline'}>
                  {rankProgress.requirements_met.personal_volume ? '✓' : '○'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Team Volume</span>
                <Badge variant={rankProgress.requirements_met.team_volume ? 'default' : 'outline'}>
                  {rankProgress.requirements_met.team_volume ? '✓' : '○'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Direct Referrals</span>
                <Badge variant={rankProgress.requirements_met.direct_referrals ? 'default' : 'outline'}>
                  {rankProgress.requirements_met.direct_referrals ? '✓' : '○'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Active Downline</span>
                <Badge variant={rankProgress.requirements_met.active_downline ? 'default' : 'outline'}>
                  {rankProgress.requirements_met.active_downline ? '✓' : '○'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link to grow your network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={referralLink || ''} readOnly />
            <Button onClick={handleCopyLink} variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
          <CardDescription>Your latest earnings from the network</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <div className="space-y-2">
              {commissions.slice(0, 5).map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Level {commission.level_depth} - {commission.commission_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCents(commission.amount_cents)}</p>
                    <Badge variant={commission.paid_out ? 'default' : 'secondary'}>
                      {commission.paid_out ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No commissions yet. Start building your network!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
