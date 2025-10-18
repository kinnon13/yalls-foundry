/**
 * Composer - iMessage-style message input
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComposerProps {
  conversationId: string;
}

export function Composer({ conversationId }: ComposerProps) {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await (supabase.rpc as any)('send_message', {
        p_conversation_id: conversationId,
        p_body: body,
        p_rich: {},
        p_attachments: [],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/40 p-3 bg-background/50 backdrop-blur-sm">
      <div className="flex items-end gap-2">
        {/* Attachments button (future) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-9 w-9"
          disabled
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="iMessage"
            className="min-h-[36px] max-h-32 resize-none rounded-full px-4 py-2 text-[14px] border-border/30 focus-visible:ring-1"
            rows={1}
          />
        </div>

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
          className="flex-shrink-0 h-9 w-9 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
