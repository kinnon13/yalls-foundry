/**
 * Reel Post Card
 * Reason badges, like/repost, disclosure ribbon
 */

import { useState } from 'react';
import { Heart, Repeat2, Share2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsageEvent } from '@/hooks/useUsageEvent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface ReelPostProps {
  data: {
    author_id: string;
    entity_id?: string;
    body: string;
    media?: any[];
    visibility: string;
  };
  itemId: string;
  muted: boolean;
  onToggleMute: () => void;
}

export function ReelPost({ data, itemId, muted, onToggleMute }: ReelPostProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const logUsageEvent = useUsageEvent();
  const { toast } = useToast();

  const hasMedia = data.media && data.media.length > 0;
  const hasReferralLink = data.body.match(/(yalls\.ai\/\S*\b(r|ref|rl|\/r\/)\b)/i) || data.body.includes('ref=');

  const handleLike = async () => {
    logUsageEvent('like', 'post', itemId);
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    
    // TODO: Call like RPC when implemented
  };

  const handleRepost = async () => {
    logUsageEvent('click', 'post', itemId, { action: 'repost' });
    toast({ title: 'Repost feature coming soon!' });
  };

  const handleShare = async () => {
    logUsageEvent('share', 'post', itemId);
    await navigator.clipboard.writeText(`${window.location.origin}/posts/${itemId}`);
    toast({ title: 'Link copied to clipboard!' });
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-card rounded-lg overflow-hidden shadow-lg animate-scale-in">
      {/* Disclosure Ribbon */}
      {hasReferralLink && (
        <div className="absolute top-0 right-0 z-10 bg-destructive text-destructive-foreground text-xs px-3 py-1 rounded-bl-lg">
          Contains referral link
        </div>
      )}

      {/* Media */}
      {hasMedia && (
        <div className="relative w-full aspect-[9/16] bg-muted">
          {data.media[0].type === 'video' ? (
            <video
              src={data.media[0].url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted={muted}
              playsInline
            />
          ) : (
            <img
              src={data.media[0].url}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Mute Toggle */}
          {data.media[0].type === 'video' && (
            <button
              onClick={onToggleMute}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Reason Badge */}
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded-full">From feed</span>
        </div>

        {/* Body */}
        <p className="text-foreground whitespace-pre-wrap mb-4">{data.body}</p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={liked ? 'text-destructive' : ''}
          >
            <Heart size={18} className={liked ? 'fill-current' : ''} />
            {likeCount > 0 && <span className="ml-1">{likeCount}</span>}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRepost}>
            <Repeat2 size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
