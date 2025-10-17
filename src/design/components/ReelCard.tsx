/**
 * ReelCard - TikTok/IG-style media card with actions
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ReelCardProps {
  media?: ReactNode;
  title: string;
  description?: string;
  author?: ReactNode;
  badges?: string[];
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onAddToCart?: () => void;
  liked?: boolean;
  likeCount?: number;
  commentCount?: number;
  className?: string;
}

export function ReelCard({
  media,
  title,
  description,
  author,
  badges,
  onLike,
  onComment,
  onShare,
  onAddToCart,
  liked,
  likeCount,
  commentCount,
  className,
}: ReelCardProps) {
  return (
    <Card className={cn('overflow-hidden group', className)}>
      {media && (
        <div className="relative aspect-[9/16] bg-muted overflow-hidden">
          {media}
          
          {/* Actions overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="space-y-2">
              {author && <div>{author}</div>}
              <h3 className="font-semibold text-white">{title}</h3>
              {description && (
                <p className="text-sm text-white/80 line-clamp-2">{description}</p>
              )}
              {badges && badges.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {badges.map((b, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {b}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right-side action bar */}
          <div className="absolute right-3 bottom-20 flex flex-col gap-3">
            {onLike && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onLike}
                className={cn(
                  'h-12 w-12 rounded-full bg-black/40 backdrop-blur hover:bg-black/60',
                  liked && 'text-red-500'
                )}
              >
                <Heart className={cn('h-6 w-6', liked && 'fill-current')} />
              </Button>
            )}
            {likeCount !== undefined && likeCount > 0 && (
              <span className="text-xs text-white text-center font-medium">
                {likeCount}
              </span>
            )}
            
            {onComment && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onComment}
                className="h-12 w-12 rounded-full bg-black/40 backdrop-blur hover:bg-black/60"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            )}
            {commentCount !== undefined && commentCount > 0 && (
              <span className="text-xs text-white text-center font-medium">
                {commentCount}
              </span>
            )}
            
            {onShare && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onShare}
                className="h-12 w-12 rounded-full bg-black/40 backdrop-blur hover:bg-black/60"
              >
                <Share2 className="h-6 w-6" />
              </Button>
            )}
            
            {onAddToCart && (
              <Button
                size="icon"
                onClick={onAddToCart}
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
