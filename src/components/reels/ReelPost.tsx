// ReelPost - Post feed item with labels and actions (PR5)
import { PostFeedItem } from '@/types/feed';
import { Heart, Repeat2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logUsageEvent } from '@/lib/telemetry/usageEvents';

interface ReelPostProps {
  reel: PostFeedItem;
  onLike?: () => void;
  onRepost?: () => void;
  onComment?: () => void;
}

export function ReelPost({ reel, onLike, onRepost, onComment }: ReelPostProps) {
  const firstMedia = reel.media?.[0];
  const isVideo = firstMedia?.type === 'video';

  const handleInteraction = (action: 'like' | 'repost' | 'comment', callback?: () => void) => {
    logUsageEvent({
      eventType: 'click',
      itemType: 'post',
      itemId: reel.id,
      payload: { action }
    });
    callback?.();
  };

  return (
    <article className="relative h-[80vh] w-full overflow-hidden rounded-xl bg-neutral-950 text-white">
      {/* Media background */}
      {firstMedia && (
        <div className="absolute inset-0">
          {isVideo ? (
            <video 
              src={firstMedia.url} 
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img 
              src={firstMedia.url} 
              alt="Post media"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        {/* Labels */}
        {reel.labels && reel.labels.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {reel.labels.includes('auto') && (
              <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm">
                Auto from network
              </Badge>
            )}
            {reel.labels.includes('repost') && (
              <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm">
                Repost
              </Badge>
            )}
            {reel.labels.includes('cross_post') && (
              <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm">
                Cross-posted
              </Badge>
            )}
          </div>
        )}

        {/* Body text */}
        <p className="text-base leading-relaxed">{reel.body}</p>

        {/* Actions */}
        <div className="flex gap-3 items-center">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 gap-2"
            onClick={() => handleInteraction('like', onLike)}
          >
            <Heart className="h-4 w-4" />
            Like
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 gap-2"
            onClick={() => handleInteraction('repost', onRepost)}
          >
            <Repeat2 className="h-4 w-4" />
            Repost
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 gap-2"
            onClick={() => handleInteraction('comment', onComment)}
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </Button>
        </div>
      </div>
    </article>
  );
}
