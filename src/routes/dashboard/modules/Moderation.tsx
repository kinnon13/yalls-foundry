/**
 * Moderation Subpanel
 * Approvals for cross-posts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';

export function Moderation() {
  const { session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending approvals
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals', session?.userId],
    queryFn: async () => {
      // Get entities owned by user
      const { data: entities } = await supabase
        .from('entities')
        .select('id')
        .eq('owner_user_id', session?.userId);
      
      if (!entities?.length) return [];
      
      const entityIds = entities.map(e => e.id);
      
      const { data } = await supabase
        .from('post_targets')
        .select('*, posts(body, author_user_id)')
        .in('target_entity_id', entityIds)
        .eq('approved', false)
        .order('created_at', { ascending: false });
      
      return data || [];
    },
    enabled: !!session?.userId,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('post_targets')
        .update({ approved, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;

      // Log to ledger
      await supabase.from('ai_action_ledger').insert({
        user_id: session?.userId,
        agent: 'user',
        action: approved ? 'cross_post_approved' : 'cross_post_denied',
        input: { post_target_id: id },
        output: { approved },
        result: 'success'
      });
    },
    onSuccess: () => {
      toast({ title: 'Action recorded' });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
  });

  if (!pendingApprovals || pendingApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingApprovals.map((approval: any) => (
        <Card key={approval.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Cross-post Request</CardTitle>
                <CardDescription>
                  Reason: {approval.reason || 'repost'}
                </CardDescription>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4 line-clamp-2">
              {approval.posts?.body || 'No content'}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate({ id: approval.id, approved: true })}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => approveMutation.mutate({ id: approval.id, approved: false })}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
