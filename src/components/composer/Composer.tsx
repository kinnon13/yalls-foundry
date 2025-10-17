/**
 * Post Composer
 * Quick post creation above feed
 */

import { useState } from 'react';
import { Send, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function Composer() {
  const [body, setBody] = useState('');
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('post_create', {
        p_body: body,
        p_visibility: 'public',
        p_entity_id: null,
        p_media: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['feed-fusion-home'] });
      toast({ title: 'Post created!' });
    },
    onError: () => {
      toast({ title: 'Failed to create post', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim()) {
      createPostMutation.mutate();
    }
  };

  if (!session) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-border">
      <Textarea
        placeholder="What's on your mind?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-[80px] mb-3 resize-none"
      />
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm">
          <Image size={18} className="mr-2" />
          Add Media
        </Button>
        <Button 
          type="submit" 
          size="sm"
          disabled={!body.trim() || createPostMutation.isPending}
        >
          <Send size={16} className="mr-2" />
          Post
        </Button>
      </div>
    </form>
  );
}
