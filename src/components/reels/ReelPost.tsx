// ReelPost - Post feed item with labels and actions (PR5)
import { PostFeedItem } from '@/types/feed';
import { Heart, Repeat2, MessageCircle, EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logUsageEvent } from '@/lib/telemetry/usageEvents';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/hooks/use-toast';

interface ReelPostProps {
  reel: PostFeedItem;
  onLike?: () => void;
  onRepost?: () => void;
  onComment?: () => void;
}

export function ReelPost({ reel, onLike, onRepost, onComment }: ReelPostProps) {
  const { session } = useSession();
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleInteraction = (action: string, callback?: () => void) => {
    logUsageEvent({
      eventType: 'click',
      itemType: 'post',
      itemId: reel.id,
      payload: { action }
    });
    if (callback) callback();
  };

  const hideMutation = useMutation({
    mutationFn: async () => {
      if (!reel.entity_id) throw new Error('Missing entity_id');
      // Prefer RPC (server enforces ownership)
      const { error: rpcErr } = await (supabase.rpc as any)('feed_hide', {
        p_entity_id: reel.entity_id,
        p_post_id: reel.id,
        p_reason: 'user_hide'
      });
      if (rpcErr) {
        // Fallback to direct insert if the RPC name differs
        const { error: insErr } = await supabase
          .from('feed_hides')
          .insert({ 
            entity_id: reel.entity_id, 
            post_id: reel.id, 
            hidden_by_user: session?.userId,
            reason: 'user_hide'
          });
        if (insErr) throw insErr;
      }
      // Telemetry via existing utility
      logUsageEvent({
        eventType: 'click',
        itemType: 'post',
        itemId: reel.id,
        payload: { action: 'hide', entity_id: reel.entity_id }
      });
      // Ledger
      await supabase.from('ai_action_ledger').insert({
        user_id: session?.userId,
        agent: 'user',
        action: 'post_hidden',
        input: { entity_id: reel.entity_id, post_id: reel.id },
        output: { status: 'ok' },
        result: 'success'
      });
    },
    onSuccess: () => {
      // Optimistic removal: prune the hidden id from the infinite query cache
      qc.setQueriesData({ queryKey: ['feed-fusion'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((p: any) => ({
            ...p,
            items: p.items.filter((it: any) => !(it.kind === 'post' && it.id === reel.id))
          }))
        };
      });
      toast({ title: 'Hidden', description: 'Post removed from this page.' });
    }
  });

  const media = reel.media?.[0];
  const isVideo = media?.type === 'video';

  return (
    <article className="relative h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-lg animate-scale-in">
      {/* Media background */}
      {media && (
        <div className="absolute inset-0">
          {isVideo ? (
            <video 
              src={media.url} 
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img 
              src={media.url} 
              alt="Post media"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Hide button */}
      {reel.entity_id && (
        <div className="absolute top-3 right-3">
          <button
            className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              hideMutation.mutate();
            }}
            disabled={hideMutation.isPending || !session}
            title="Hide from this page"
          >
            <EllipsisVertical className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4 animate-slide-up">
        {/* Labels */}
        {reel.labels && reel.labels.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {reel.labels.includes('auto') && (
              <Badge variant="secondary" className="bg-primary/20 text-primary-foreground backdrop-blur-md border border-primary/30">
                Auto from network
              </Badge>
            )}
            {reel.labels.includes('repost') && (
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground backdrop-blur-md border border-accent/30">
                Repost
              </Badge>
            )}
            {reel.labels.includes('cross_post') && (
              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground backdrop-blur-md border border-secondary/30">
                Cross-posted
              </Badge>
            )}
          </div>
        )}

        {/* Body text */}
        <p className="text-base leading-relaxed text-primary-foreground">{reel.body}</p>

        {/* Actions */}
        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary/20 hover:text-primary-foreground gap-2 transition-all duration-200 hover:scale-105"
            onClick={() => handleInteraction('like', onLike)}
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Like</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary/20 hover:text-primary-foreground gap-2 transition-all duration-200 hover:scale-105"
            onClick={() => handleInteraction('repost', onRepost)}
          >
            <Repeat2 className="h-4 w-4" />
            <span className="hidden sm:inline">Repost</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary/20 hover:text-primary-foreground gap-2 transition-all duration-200 hover:scale-105"
            onClick={() => handleInteraction('comment', onComment)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Comment</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
