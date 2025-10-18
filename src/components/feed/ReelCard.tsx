/**
 * ReelCard - Full-bleed post card with media, author chip, and actions
 */

import { PostFeedItem } from '@/types/feed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Repeat2 } from 'lucide-react';
import { logClick } from '@/lib/telemetry/usage';

interface ReelCardProps {
  post: PostFeedItem;
}

export function ReelCard({ post }: ReelCardProps) {
  const handleAction = (action: string) => {
    logClick('feed_reel', 'post', post.id);
    console.log(`[ReelCard] ${action}:`, post.id);
  };

  return (
    <div className="relative flex flex-col aspect-square w-full bg-background overflow-hidden rounded-2xl">
      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="absolute inset-0 -z-10">
          <img 
            src={post.media[0].url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content Overlay */}
      <div className="flex-1 flex flex-col justify-end p-4 bg-gradient-to-t from-background/90 to-transparent">
        {/* Author Chip */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage src="" alt="" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">
              {post.author_user_id ? `User ${post.author_user_id.slice(0, 8)}` : 'Anonymous'}
            </p>
            {post.labels && post.labels.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {post.labels.includes('repost') ? '🔁 Reposted' : ''}
                {post.labels.includes('auto') ? '✨ Auto-shared' : ''}
                {post.labels.includes('cross_post') ? '🔀 Cross-posted' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <p className="text-sm text-foreground mb-4 line-clamp-3">
          {post.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('like')}
            className="gap-2"
          >
            <Heart className="h-4 w-4" />
            <span className="text-xs">Like</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('comment')}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Comment</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('share')}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('repost')}
            className="gap-2"
          >
            <Repeat2 className="h-4 w-4" />
            <span className="text-xs">Repost</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
