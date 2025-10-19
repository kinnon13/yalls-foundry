import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

export default function ApprovalsPage() {
  const queryClient = useQueryClient();

  // Fetch pending proposals
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['pending-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_change_proposals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch pending promotions
  const { data: promotions } = useQuery({
    queryKey: ['pending-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_promotion_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Approve proposal mutation
  const approveProposal = useMutation({
    mutationFn: async (proposalId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert approval
      const { error: approvalError } = await supabase
        .from('ai_change_approvals')
        .insert({
          proposal_id: proposalId,
          approver_id: user.id,
          approver_role: 'super_admin',
          decision: 'approve',
          reason: 'Approved via dashboard'
        });

      if (approvalError) throw approvalError;

      // Get current count first
      const { data: currentProposal } = await supabase
        .from('ai_change_proposals')
        .select('approvals_collected')
        .eq('id', proposalId)
        .single();

      if (!currentProposal) throw new Error('Proposal not found');

      // Update proposal status
      const { error: updateError } = await supabase
        .from('ai_change_proposals')
        .update({ 
          status: 'approved',
          approvals_collected: currentProposal.approvals_collected + 1
        })
        .eq('id', proposalId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-proposals'] });
      toast.success('Proposal approved!');
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  // Reject proposal mutation
  const rejectProposal = useMutation({
    mutationFn: async ({ proposalId, reason }: { proposalId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert rejection
      const { error: approvalError } = await supabase
        .from('ai_change_approvals')
        .insert({
          proposal_id: proposalId,
          approver_id: user.id,
          approver_role: 'super_admin',
          decision: 'reject',
          reason
        });

      if (approvalError) throw approvalError;

      // Update proposal status
      const { error: updateError } = await supabase
        .from('ai_change_proposals')
        .update({ status: 'rejected' })
        .eq('id', proposalId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-proposals'] });
      toast.success('Proposal rejected');
    },
  });

  // Approve promotion mutation
  const approvePromotion = useMutation({
    mutationFn: async (promotionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('ai_approve', {
        p_id: promotionId,
        p_admin: user.id,
        p_decision: 'approve',
        p_notes: 'Approved via dashboard'
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-promotions'] });
      toast.success('Knowledge shared successfully!');
    },
  });

  // Reject promotion mutation
  const rejectPromotion = useMutation({
    mutationFn: async ({ promotionId, reason }: { promotionId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('ai_approve', {
        p_id: promotionId,
        p_admin: user.id,
        p_decision: 'reject',
        p_notes: reason
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-promotions'] });
      toast.success('Knowledge sharing rejected');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const pendingCount = (proposals?.length || 0) + (promotions?.length || 0);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve Rocker's requests to share knowledge
        </p>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="mt-4">
            {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
          </Badge>
        )}
      </div>

      {pendingCount === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending approvals</p>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Sharing Requests (Promotions) */}
      {promotions && promotions.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Knowledge Sharing Requests</h2>
          {promotions.map((promo) => (
            <Card key={promo.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Share Knowledge: {promo.from_scope} <ArrowRight className="inline h-4 w-4" /> {promo.to_scope}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {promo.reason || 'No reason provided'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-md p-4 mb-4">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(promo.payload, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => approvePromotion.mutate(promo.id)}
                    disabled={approvePromotion.isPending}
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectPromotion.mutate({ 
                      promotionId: promo.id, 
                      reason: 'Rejected via dashboard' 
                    })}
                    disabled={rejectPromotion.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Change Proposals */}
      {proposals && proposals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Change Proposals</h2>
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {proposal.target_scope}: {proposal.target_ref}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Approvals: {proposal.approvals_collected} / {proposal.approvals_required}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-md p-4 mb-4">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(proposal.change, null, 2)}
                  </pre>
                </div>
                <Separator className="my-4" />
                <div className="flex gap-2">
                  <Button
                    onClick={() => approveProposal.mutate(proposal.id)}
                    disabled={approveProposal.isPending}
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectProposal.mutate({ 
                      proposalId: proposal.id, 
                      reason: 'Rejected via dashboard' 
                    })}
                    disabled={rejectProposal.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
