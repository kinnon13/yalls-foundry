import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Network,
  Users,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';

/**
 * MLM Network Page - Downline tree, commission tracking, link builder
 * Context-aware: Shows data for active profile only
 */

interface Affiliate {
  id: string;
  user_id: string;
  parent_id: string | null;
  tier: number;
  status: string;
  joined_at: string;
  total_earnings: number;
  direct_referrals: number;
  profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export default function MLMPage() {
  const { activeProfile } = useProfile();
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState({
    totalDownline: 0,
    directReferrals: 0,
    totalEarnings: 0,
    pendingCommissions: 0,
  });
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    if (activeProfile) {
      loadMLMData();
      generateReferralLink();
    }
  }, [activeProfile]);

  const loadMLMData = async () => {
    if (!activeProfile) return;

    // Load commission data from affiliate_subscriptions
    const { data: subscriptions } = await supabase
      .from('affiliate_subscriptions')
      .select('*')
      .eq('referrer_user_id', activeProfile.id)
      .order('created_at', { ascending: false });

    if (subscriptions) {
      // Map to Affiliate type for display
      const mappedAffiliates = subscriptions.map((sub) => ({
        id: sub.id,
        user_id: sub.referred_user_id,
        parent_id: sub.referrer_user_id,
        tier: 1, // Calculate tier based on tree depth
        status: sub.status,
        joined_at: sub.created_at,
        total_earnings: 0, // TODO: Calculate from commission_ledger
        direct_referrals: 0,
      }));
      
      setAffiliates(mappedAffiliates as any);
      
      setStats({
        totalDownline: subscriptions.length,
        directReferrals: subscriptions.length,
        totalEarnings: 0, // TODO: Sum from commission_ledger
        pendingCommissions: 0,
      });
    }
  };

  const generateReferralLink = () => {
    if (!activeProfile) return;
    const baseUrl = window.location.origin;
    const code = btoa(activeProfile.id).slice(0, 8); // Simple code generation
    setReferralLink(`${baseUrl}/ref/${code}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Link copied',
      description: 'Referral link copied to clipboard',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            MLM Network
          </h1>
          <p className="text-muted-foreground">
            {activeProfile ? `Viewing ${activeProfile.name}'s network` : 'Select a profile'}
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          Tier 1
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downline</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownline}</div>
            <p className="text-xs text-muted-foreground">All levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direct Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.directReferrals}</div>
            <p className="text-xs text-muted-foreground">Level 1</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalEarnings / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All-time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.pendingCommissions / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">In hold period</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link to recruit affiliates to your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted p-3 rounded-md font-mono text-sm truncate">
              {referralLink}
            </div>
            <Button onClick={copyLink} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Downline Tree */}
      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tree">Downline Tree</TabsTrigger>
          <TabsTrigger value="commissions">Commission History</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Direct Referrals (Level 1)</CardTitle>
              <CardDescription>
                {stats.directReferrals} affiliates reporting directly to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {affiliates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No direct referrals yet</p>
                  <p className="text-sm">Share your referral link to start building your network</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {affiliates.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {affiliate.profile?.display_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(affiliate.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ${(affiliate.total_earnings / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Earnings</p>
                        </div>
                        <Badge variant="secondary">Tier {affiliate.tier}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Track your earnings from downline sales</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-12">
                Commission tracking will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Network Leaderboard</CardTitle>
              <CardDescription>Top performers in your downline</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-12">
                Leaderboard rankings will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
