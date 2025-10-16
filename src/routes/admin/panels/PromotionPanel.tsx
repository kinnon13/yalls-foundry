import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, CheckCircle2, XCircle, Clock, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export function PromotionPanel() {
  const [reviewingPromotion, setReviewingPromotion] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const queryClient = useQueryClient();

  // List promotions
  const { data: promotionsData } = useQuery({
    queryKey: ['promotions', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('promotion-manager', {
        body: { action: 'list' },
      });
      if (error) throw error;
      return data;
    },
  });

  // Approve/reject mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, notes }: { id: string; decision: string; notes: string }) => {
      const { data, error } = await supabase.functions.invoke('promotion-manager', {
        body: { action: 'approve', id, decision, notes },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion reviewed');
      setReviewingPromotion(null);
      setReviewNotes('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to review promotion');
    },
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('promotion-manager', {
        body: { action: 'apply', id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion applied to global knowledge');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to apply promotion');
    },
  });

  const queue = promotionsData?.queue || [];
  const pending = queue.filter((p: any) => p.status === 'pending');
  const approved = queue.filter((p: any) => p.status === 'approved');
  const rejected = queue.filter((p: any) => p.status === 'rejected');
  const applied = queue.filter((p: any) => p.status === 'applied');

  const PromotionCard = ({ promotion }: { promotion: any }) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
      approved: { icon: CheckCircle2, color: 'text-green-500', label: 'Approved' },
      rejected: { icon: XCircle, color: 'text-red-500', label: 'Rejected' },
      applied: { icon: PlayCircle, color: 'text-blue-500', label: 'Applied' },
    };

    const config = statusConfig[promotion.status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {promotion.from_scope} → {promotion.to_scope}
                </Badge>
                <Badge className={config.color}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Proposed by {promotion.proposer?.display_name || 'Unknown'}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(promotion.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              {promotion.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setReviewingPromotion(promotion)}
                  >
                    Review
                  </Button>
                </>
              )}
              {promotion.status === 'approved' && (
                <Button
                  size="sm"
                  onClick={() => applyMutation.mutate(promotion.id)}
                  disabled={applyMutation.isPending}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              )}
            </div>
          </div>

          <div className="text-sm">
            <div className="font-medium mb-1">Reason:</div>
            <div className="text-muted-foreground">{promotion.reason || 'No reason provided'}</div>
          </div>

          <div className="text-sm">
            <div className="font-medium mb-1">Payload:</div>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(promotion.payload, null, 2)}
            </pre>
          </div>

          {promotion.reviewed_at && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Reviewed by {promotion.approver?.display_name || 'Unknown'} on{' '}
              {new Date(promotion.reviewed_at).toLocaleString()}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-blue-500" />
            <CardTitle>Knowledge Promotion Queue</CardTitle>
          </div>
          <CardDescription>
            Review and approve knowledge flowing up the hierarchy: User → Admin → Andy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                Pending <Badge className="ml-2">{pending.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved <Badge className="ml-2">{approved.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="applied">
                Applied <Badge className="ml-2">{applied.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected <Badge className="ml-2">{rejected.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {pending.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        No pending promotions
                      </CardContent>
                    </Card>
                  ) : (
                    pending.map((p: any) => <PromotionCard key={p.id} promotion={p} />)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="approved">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {approved.map((p: any) => <PromotionCard key={p.id} promotion={p} />)}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="applied">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {applied.map((p: any) => <PromotionCard key={p.id} promotion={p} />)}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="rejected">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {rejected.map((p: any) => <PromotionCard key={p.id} promotion={p} />)}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!reviewingPromotion} onOpenChange={(open) => !open && setReviewingPromotion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Promotion</DialogTitle>
            <DialogDescription>
              Approve or reject this knowledge promotion. Your decision will be logged.
            </DialogDescription>
          </DialogHeader>
          {reviewingPromotion && (
            <div className="space-y-4">
              <div className="text-sm">
                <div className="font-medium">From: {reviewingPromotion.from_scope}</div>
                <div className="font-medium">To: {reviewingPromotion.to_scope}</div>
                <div className="text-muted-foreground mt-2">{reviewingPromotion.reason}</div>
              </div>
              <Textarea
                placeholder="Add review notes (optional)..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                reviewMutation.mutate({
                  id: reviewingPromotion?.id,
                  decision: 'reject',
                  notes: reviewNotes,
                })
              }
              disabled={reviewMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() =>
                reviewMutation.mutate({
                  id: reviewingPromotion?.id,
                  decision: 'approve',
                  notes: reviewNotes,
                })
              }
              disabled={reviewMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
