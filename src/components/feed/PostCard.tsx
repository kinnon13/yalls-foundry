/**
 * Post Card - Shows labels (auto from, repost by, etc.)
 * <200 LOC
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

type PostCardProps = {
  target: any;
};

export function PostCard({ target }: PostCardProps) {
  const post = target.posts;
  const author = post?.profiles;
  const authorEntity = post?.entities;

  if (!post) return null;

  const getLabelText = () => {
    if (target.reason === 'auto_propagate') {
      return `Auto from ${authorEntity?.display_name || 'Unknown'}`;
    }
    if (target.reason === 'repost') {
      return `Repost by @${authorEntity?.handle || 'unknown'}`;
    }
    if (target.reason === 'cross_post') {
      return `Cross-posted`;
    }
    return null;
  };

  const labelText = getLabelText();

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Label */}
        {labelText && (
          <Badge variant="secondary" className="text-xs">
            {labelText}
          </Badge>
        )}

        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.avatar_url} />
            <AvatarFallback>
              {author?.display_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author?.display_name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Body */}
        <p className="text-foreground whitespace-pre-wrap">{post.body}</p>

        {/* Media */}
        {post.media && Array.isArray(post.media) && post.media.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.media.map((item: any, idx: number) => (
              <img
                key={idx}
                src={item.url}
                alt="Post media"
                className="rounded-lg w-full h-48 object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
