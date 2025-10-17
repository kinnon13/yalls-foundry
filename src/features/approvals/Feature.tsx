/**
 * Approvals Feature
 * 
 * Standalone feature for reviewing and approving pending content
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { Badge } from '@/design/components/Badge';
import { X, Check, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FeatureProps } from '@/feature-kernel/types';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await (supabase as any).rpc('get_pending_approvals_by_user', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return (data || []).filter((a: any) => {
        if (filter === 'pending') return a.status === 'pending';
        if (filter === 'approved') return a.status === 'approved';
        if (filter === 'rejected') return a.status === 'rejected';
        return true;
      });
    },
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (approvalId: string) => {
      const { error } = await supabase
        .from('ai_change_approvals')
        .insert({
          proposal_id: approvalId,
          approver_id: (await supabase.auth.getUser()).data.user!.id,
          approver_role: 'user',
          decision: 'approved',
        });

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
    mutationFn: async ({ approvalId, reason }: { approvalId: string; reason?: string }) => {
      const { error } = await supabase
        .from('ai_change_approvals')
        .insert({
          proposal_id: approvalId,
          approver_id: (await supabase.auth.getUser()).data.user!.id,
          approver_role: 'user',
          decision: 'rejected',
          reason,
        });

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
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No {filter !== 'all' && `${filter} `}approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval: any) => (
              <div
                key={approval.id}
                className="p-3 border border-border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{approval.target_scope}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {approval.target_ref}
                    </div>
                  </div>
                  <Badge variant={
                    approval.status === 'approved' ? 'success' :
                    approval.status === 'rejected' ? 'danger' :
                    'default'
                  }>
                    {approval.status}
                  </Badge>
                </div>
                {approval.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="s"
                      onClick={() => approveMutation.mutate(approval.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      <Check size={14} />
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="s"
                      onClick={() => rejectMutation.mutate({ approvalId: approval.id })}
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
