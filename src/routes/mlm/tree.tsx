/**
 * MLM Genealogy Tree Page
 * 
 * Visual representation of referral tree (org chart style).
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMyReferralTree } from '@/lib/mlm/service.supabase';
import { getRankBadgeClass } from '@/entities/mlm';
import { Users, ChevronDown } from 'lucide-react';

export default function MLMTree() {
  const { data: tree, isLoading } = useQuery({
    queryKey: ['mlm-tree'],
    queryFn: () => getMyReferralTree(5),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Referral Tree</h1>
        <p className="text-muted-foreground">Loading your network genealogy...</p>
      </div>
    );
  }

  // Group by level
  const levelGroups: Record<number, typeof tree> = {};
  tree?.forEach((node) => {
    if (!levelGroups[node.level_depth]) {
      levelGroups[node.level_depth] = [];
    }
    levelGroups[node.level_depth].push(node);
  });

  const maxLevel = Math.max(...Object.keys(levelGroups).map(Number), 0);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Referral Tree</h1>
        <p className="text-muted-foreground">Your network genealogy (5 levels deep)</p>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Network Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{tree?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Downline</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ChevronDown className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{maxLevel}</p>
                <p className="text-sm text-muted-foreground">Max Depth</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{levelGroups[1]?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Direct Referrals</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tree Visualization (Simple List by Level) */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((level) => {
          const nodes = levelGroups[level] || [];
          if (nodes.length === 0) return null;

          return (
            <Card key={level}>
              <CardHeader>
                <CardTitle>Level {level}</CardTitle>
                <CardDescription>{nodes.length} members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {nodes.map((node) => (
                    <div
                      key={node.user_id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {node.display_name || node.email || 'User ' + node.user_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {node.direct_referrals_count || 0} direct referrals
                        </p>
                      </div>
                      {node.current_rank && (
                        <Badge className={getRankBadgeClass(node.current_rank)} variant="outline">
                          {node.current_rank.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!tree || tree.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Downline Yet</h3>
            <p className="text-muted-foreground">
              Share your referral link to start building your network!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
