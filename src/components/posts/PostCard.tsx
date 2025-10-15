import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { usePostActions } from '@/hooks/usePostActions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
  post: {
    id: string;
    body?: string;
    author_id: string;
    created_at: string;
    media?: Array<{ url: string; type: string }>;
  };
  author?: {
    display_name?: string;
    avatar_url?: string;
  };
  onSaved?: () => void;
  onReshared?: () => void;
}

export function PostCard({ post, author, onSaved, onReshared }: PostCardProps) {
  const { loading, savePost, resharePost } = usePostActions();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    try {
      await savePost({ post_id: post.id });
      setIsSaved(true);
      onSaved?.();
      toast({
        title: "Post saved",
        description: "Added to your saved posts",
      });
    } catch (error) {
      toast({
        title: "Failed to save",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const handleReshare = async () => {
    try {
      await resharePost({ post_id: post.id, commentary: '' });
      onReshared?.();
      toast({
        title: "Post reshared",
        description: "Shared to your feed",
      });
    } catch (error) {
      toast({
        title: "Failed to reshare",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4" data-testid="post-card">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.avatar_url} />
            <AvatarFallback>{author?.display_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{author?.display_name || 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Report</DropdownMenuItem>
            <DropdownMenuItem>Hide</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Content */}
      {post.body && (
        <p className="text-sm mb-3 whitespace-pre-wrap">{post.body}</p>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img
            src={post.media[0].url}
            alt="Post media"
            className="w-full object-cover max-h-96"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={loading || isSaved}
          data-testid="save-button"
          className="gap-2"
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          {isSaved ? 'Saved' : 'Save'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReshare}
          disabled={loading}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Reshare
        </Button>
      </div>
    </Card>
  );
}
