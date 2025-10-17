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
  const handleInteraction = (action: string, callback?: () => void) => {
    logUsageEvent({
      eventType: 'click',
      itemType: 'post',
      itemId: reel.id,
      payload: { action }
    });
    if (callback) callback();
  };

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
