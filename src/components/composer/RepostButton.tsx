/**
 * Repost Button Component
 * Production UI: Mac efficiency + TikTok feel + Amazon capabilities
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/design/components/Button';
import { useToast } from '@/hooks/use-toast';
import { Repeat2 } from 'lucide-react';
import { repostWithAttribution } from '@/lib/feed/repost';
import { CrossPostPicker } from './CrossPostPicker';
import { tokens } from '@/design/tokens';

interface RepostButtonProps {
  postId: string;
  onSuccess?: () => void;
}

export function RepostButton({ postId, onSuccess }: RepostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [targets, setTargets] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const repost = useMutation({
    mutationFn: () => repostWithAttribution({
      sourcePostId: postId,
      caption: caption || undefined,
      targetEntities: targets.length > 0 ? targets : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast({ title: 'Reposted successfully' });
      setIsOpen(false);
      setCaption('');
      setTargets([]);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Failed to repost',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  if (!isOpen) {
    return (
      <Button variant="ghost" size="s" onClick={() => setIsOpen(true)}>
        <Repeat2 size={14} style={{ marginRight: tokens.space.xxs }} />
        Repost
      </Button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: tokens.color.bg.dark,
      border: `1px solid ${tokens.color.text.secondary}40`,
      borderRadius: tokens.radius.m,
      padding: tokens.space.l,
      width: '90%',
      maxWidth: 500,
      zIndex: tokens.zIndex.modal,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.bold, marginBottom: tokens.space.m }}>
        Repost
      </h3>

      <textarea
        placeholder="Add a caption (optional)..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{
          width: '100%',
          minHeight: 80,
          padding: tokens.space.m,
          background: tokens.color.bg.light,
          border: `1px solid ${tokens.color.text.secondary}40`,
          borderRadius: tokens.radius.s,
          color: tokens.color.text.primary,
          fontSize: tokens.typography.size.m,
          marginBottom: tokens.space.m,
          resize: 'vertical',
        }}
      />

      <CrossPostPicker selectedTargets={targets} onTargetsChange={setTargets} />

      <div style={{ display: 'flex', gap: tokens.space.s, justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="m" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="m"
          onClick={() => repost.mutate()}
          disabled={repost.isPending}
        >
          {repost.isPending ? 'Reposting...' : 'Repost'}
        </Button>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: -1,
        }}
      />
    </div>
  );
}
