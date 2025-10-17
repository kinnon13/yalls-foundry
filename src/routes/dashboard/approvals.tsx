/**
 * Approvals Module - Three-column layout for pending cross-posts
 * <200 LOC
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePendingApprovals, useApproveTarget, useRejectTarget } from '@/hooks/useApprovals';

const REJECT_REASONS = [
  { value: 'off_topic', label: 'Off-topic' },
  { value: 'low_quality', label: 'Low quality' },
  { value: 'not_relevant', label: 'Not relevant' },
  { value: 'other', label: 'Other' },
];

export default function Approvals() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('not_relevant');

  // Get user's owned entities
  const { data: entities, isLoading: entitiesLoading } = useQuery({
    queryKey: ['owned-entities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('entities')
        .select('id, display_name, handle')
        .eq('owner_user_id', user.id);

      if (error) throw error;
      
      // Auto-select first entity
      if (data && data.length > 0 && !selectedEntityId) {
        setSelectedEntityId(data[0].id);
      }

      return data;
    },
  });

  const {
    data,
    isLoading: pendingLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePendingApprovals(selectedEntityId);

  const approveMutation = useApproveTarget();
  const rejectMutation = useRejectTarget();

  const pending = data?.pages.flatMap(page => page.items) ?? [];

  const handleApprove = () => {
    if (!selectedPost || !selectedEntityId) return;
    approveMutation.mutate(
      { postId: selectedPost.post_id, entityId: selectedEntityId },
      { onSuccess: () => setSelectedPost(null) }
    );
  };

  const handleReject = () => {
    if (!selectedPost || !selectedEntityId) return;
    rejectMutation.mutate(
      { postId: selectedPost.post_id, entityId: selectedEntityId, reason: rejectReason },
      { onSuccess: () => setSelectedPost(null) }
    );
  };

  if (entitiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!entities || entities.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Approvals</h1>
        <p className="text-muted-foreground">You don't own any entities yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-6">
      {/* Left: Entity Picker */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <h2 className="font-semibold">Your Pages</h2>
        <div className="space-y-2">
          {entities.map((entity) => (
            <Button
              key={entity.id}
              variant={selectedEntityId === entity.id ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => {
                setSelectedEntityId(entity.id);
                setSelectedPost(null);
              }}
            >
              {entity.display_name}
            </Button>
          ))}
        </div>
      </div>

      {/* Middle: Pending Posts List */}
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
        <h2 className="font-semibold">
          Pending Approvals {pending.length > 0 && `(${pending.length})`}
        </h2>
        
        {pendingLoading && <Loader2 className="h-6 w-6 animate-spin" />}
        
        {!pendingLoading && pending.length === 0 && (
          <p className="text-muted-foreground">No pending approvals.</p>
        )}

        {pending.map((item) => (
          <Card
            key={item.post_id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedPost?.post_id === item.post_id ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedPost(item)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.author_avatar || undefined} />
                <AvatarFallback>{item.author_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.author_name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground truncate">{item.body.substring(0, 80)}...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(item.post_created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {hasNextPage && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>

      {/* Right: Approval Drawer */}
      <div className="w-96 flex-shrink-0 space-y-4">
        {!selectedPost ? (
          <div className="text-center text-muted-foreground py-12">
            Select a post to review
          </div>
        ) : (
          <Card className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedPost.author_avatar || undefined} />
                <AvatarFallback>{selectedPost.author_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedPost.author_name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(selectedPost.post_created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="whitespace-pre-wrap">{selectedPost.body}</p>
              
              {selectedPost.media && Array.isArray(selectedPost.media) && selectedPost.media.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.media.map((item: any, idx: number) => (
                    <img
                      key={idx}
                      src={item.url}
                      alt="Post media"
                      className="rounded-lg w-full h-32 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Button
                className="w-full"
                onClick={handleApprove}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>

              <div className="space-y-2">
                <Select value={rejectReason} onValueChange={setRejectReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Reason for rejection" />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECT_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReject}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
