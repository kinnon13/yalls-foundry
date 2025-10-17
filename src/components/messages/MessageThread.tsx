/**
 * Message Thread - Center pane showing conversation messages
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  metadata: any;
  sender: {
    display_name: string;
    avatar_url: string | null;
  } | null;
};

type MessageThreadProps = {
  conversationId: string | null;
};

export function MessageThread({ conversationId }: MessageThreadProps) {
  const session = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId && !!session?.session?.userId,
    refetchInterval: 3000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_user_id, recipient_user_id, body, created_at, read_at, metadata')
        .or(`and(sender_user_id.eq.${session!.session!.userId},recipient_user_id.eq.${conversationId}),and(sender_user_id.eq.${conversationId},recipient_user_id.eq.${session!.session!.userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark unread messages as read
      const unreadIds = data
        ?.filter(m => m.recipient_user_id === session!.session!.userId && !m.read_at)
        .map(m => m.id) || [];

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }

      // Fetch profiles for senders
      const senderIds = Array.from(new Set(data?.map(m => m.sender_user_id) || []));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data?.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_user_id) || null
      })) as Message[];
    }
  });

  const { data: otherUser } = useQuery({
    queryKey: ['user-profile', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', conversationId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await (supabase.rpc as any)('dm_send', {
        p_recipient: conversationId,
        p_body: body,
        p_metadata: {}
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
        title: 'Failed to send',
        description: error instanceof Error ? error.message : 'Could not send message',
        variant: 'destructive'
      });
    }
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !session?.session?.userId) return;

    const channel = supabase
      .channel(`thread-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_user_id=eq.${session.session.userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, session?.session?.userId, queryClient]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !conversationId) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Select a conversation or start a new one</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.avatar_url || undefined} />
              <AvatarFallback>{otherUser?.display_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{otherUser?.display_name || 'Loading...'}</p>
              <p className="text-xs text-muted-foreground">Active recently</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages?.map((msg, idx) => {
            const isFromMe = msg.sender_user_id === session?.session?.userId;
            const showAvatar = idx === 0 || messages[idx - 1].sender_user_id !== msg.sender_user_id;

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  isFromMe ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {showAvatar ? (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                    <AvatarFallback>{msg.sender?.display_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div className={cn('flex flex-col gap-1 max-w-[70%]', isFromMe && 'items-end')}>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2',
                      isFromMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] max-h-[120px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}
