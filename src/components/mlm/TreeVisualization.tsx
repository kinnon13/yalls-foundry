/**
 * MLM Tree Visualization Component
 */

import { Card } from '@/components/ui/card';
import { useMyDownlineTree } from '@/lib/mlm/hooks';
import { Loader2, User, Building2 } from 'lucide-react';

export function TreeVisualization() {
  const { data: tree, isLoading } = useMyDownlineTree(5);

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p>No downline yet. Share your referral link to build your network!</p>
        </div>
      </Card>
    );
  }

  // Group by depth for level-based display
  const levels = tree.reduce((acc, node) => {
    if (!acc[node.depth]) acc[node.depth] = [];
    acc[node.depth].push(node);
    return acc;
  }, {} as Record<number, typeof tree>);

  return (
    <Card className="p-6">
      <div className="space-y-8">
        {Object.entries(levels).map(([depth, nodes]) => (
          <div key={depth} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Level {depth}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nodes.map((node) => (
                <Card key={node.party_id} className="p-4 border-l-4 border-primary">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {node.party_kind === 'user' ? (
                        <User className="h-4 w-4 text-primary" />
                      ) : (
                        <Building2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {node.party_kind === 'user' ? 'User' : 'Business'}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Orders:</span>
                          <span className="font-medium">{node.total_orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sales:</span>
                          <span className="font-medium">
                            ${node.total_sales.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Earned:</span>
                          <span className="font-medium text-primary">
                            ${node.commission_earned.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
