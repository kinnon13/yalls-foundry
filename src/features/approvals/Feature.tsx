/**
 * Approvals Feature
 * 
 * Standalone feature for reviewing and approving pending content
 * Uses hardened PR2.5 RPCs with observability
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { Badge } from '@/design/components/Badge';
import { X, Check, XCircle } from 'lucide-react';
import { rpcWithObs } from '@/lib/supaRpc';
import { toast } from 'sonner';
import type { FeatureProps } from '@/feature-kernel/types';

interface PendingPost {
  post_id: string;
  target_entity_id: string;
  source_post_id?: string;
  reason: string;
  approved: boolean;
  created_at: string;
}

interface ApprovalsFeatureProps extends FeatureProps {
  entity?: string;
  filter?: 'all' | 'pending' | 'approved' | 'rejected';
  featureId: string;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

export default function ApprovalsFeature({
  entity,
  filter = 'pending',
  featureId,
  updateProps,
  close,
}: ApprovalsFeatureProps) {
  const queryClient = useQueryClient();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals-feature', entity, filter],
    queryFn: async () => {
      if (!entity) return [];

      const { data, error } = await rpcWithObs(
        'feed_pending_targets',
        { p_entity_id: entity },
        { surface: 'feature_approvals', feature: 'approvals' }
      );

      if (error) throw error;
      
      const rows = (data || []) as PendingPost[];
      
      // Client-side filter for approved/rejected (these would need separate RPC or flag)
      if (filter === 'pending') return rows.filter(r => !r.approved);
      if (filter === 'approved') return rows.filter(r => r.approved);
      return rows;
    },
    refetchInterval: 30000,
    enabled: !!entity,
  });

  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!entity) throw new Error('No entity selected');

      const { error } = await rpcWithObs(
        'post_approve_target',
        { p_post_id: postId, p_entity_id: entity },
        { surface: 'feature_approvals' }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals-feature'] });
      toast.success('Approved');
    },
    onError: (error) => {
      toast.error('Failed to approve', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason?: string }) => {
      if (!entity) throw new Error('No entity selected');

      const { error } = await rpcWithObs(
        'post_reject_target',
        { p_post_id: postId, p_entity_id: entity, p_reason: reason ?? null },
        { surface: 'feature_approvals' }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals-feature'] });
      toast.success('Rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Approvals</CardTitle>
            {approvals.length > 0 && (
              <Badge variant="default">{approvals.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'secondary' : 'ghost'}
                  size="s"
                  onClick={() => updateProps({ filter: f })}
                >
                  {f}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="s" onClick={close}>
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!entity ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Select an entity to view approvals</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No {filter !== 'all' && `${filter} `}approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={approval.post_id}
                className="p-3 border border-border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{approval.reason}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Post: {approval.post_id}
                    </div>
                  </div>
                  <Badge variant={approval.approved ? 'success' : 'default'}>
                    {approval.approved ? 'approved' : 'pending'}
                  </Badge>
                </div>
                {!approval.approved && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="s"
                      onClick={() => approveMutation.mutate(approval.post_id)}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      <Check size={14} />
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="s"
                      onClick={() => rejectMutation.mutate({ postId: approval.post_id })}
                      disabled={rejectMutation.isPending}
                      className="flex-1"
                    >
                      <XCircle size={14} />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
