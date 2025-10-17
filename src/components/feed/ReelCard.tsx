/**
 * ReelCard - Full-bleed post card with media, author chip, and actions
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Repeat2 } from 'lucide-react';
import type { PostFeedItem } from '@/types/feed';

interface ReelCardProps {
  post: PostFeedItem;
}

export function ReelCard({ post }: ReelCardProps) {
  const hasMedia = post.media && post.media.length > 0;

  return (
    <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
      {/* Media */}
      {hasMedia && (
        <div className="relative aspect-[9/16] bg-muted">
          <img
            src={post.media[0].url}
            alt=""
            className="w-full h-full object-cover"
          />
          {post.labels && post.labels.length > 0 && (
            <div className="absolute top-4 right-4 flex gap-2">
              {post.labels.map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 bg-black/60 text-white text-xs rounded-full"
                >
                  {label.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Author chip */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10" />
          <span className="text-sm font-medium">
            {post.author_user_id?.substring(0, 8)}
          </span>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed">{post.body}</p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <Heart className="w-4 h-4" />
            <span className="text-xs">Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Comment</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Repeat2 className="w-4 h-4" />
            <span className="text-xs">Repost</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
