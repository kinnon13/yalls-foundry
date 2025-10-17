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
    <Card className="h-full flex flex-col border-0 shadow-xl backdrop-blur-sm bg-card/80">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-background shadow-md transition-transform group-hover:scale-105">
                <AvatarImage src={otherUser?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {otherUser?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
            </div>
            <div>
              <p className="font-semibold text-lg">{otherUser?.display_name || 'Loading...'}</p>
              <p className="text-xs text-muted-foreground">Active recently</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="hover:bg-muted/50">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent 
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-muted/10" 
        ref={scrollRef}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">No messages yet</p>
            <p className="text-xs text-muted-foreground/70">Start the conversation!</p>
          </div>
        ) : (
          messages?.map((msg, idx) => {
            const isFromMe = msg.sender_user_id === session?.session?.userId;
            const showAvatar = idx === 0 || messages[idx - 1].sender_user_id !== msg.sender_user_id;

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  isFromMe ? 'flex-row-reverse' : 'flex-row'
                )}
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                {showAvatar ? (
                  <Avatar className="h-8 w-8 flex-shrink-0 ring-1 ring-border shadow-sm">
                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                      {msg.sender?.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div className={cn('flex flex-col gap-1 max-w-[75%]', isFromMe && 'items-end')}>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 shadow-sm transition-all hover:shadow-md',
                      isFromMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border/50'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-2">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <div className="p-4 border-t bg-gradient-to-r from-muted/30 to-transparent backdrop-blur-sm">
        <div className="flex gap-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[64px] max-h-[120px] resize-none bg-background/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            size="icon"
            className="h-[64px] w-[64px] flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2 px-1">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-semibold">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-semibold">Shift+Enter</kbd> for new line
        </p>
      </div>
    </Card>
  );
}
