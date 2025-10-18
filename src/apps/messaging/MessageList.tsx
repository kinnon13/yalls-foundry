/**
 * MessageList - iMessage-style message bubbles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  body: string;
  sender_id: string;
  sent_at: string;
  status: string;
  read_by?: string[];
}

interface MessageListProps {
  conversationId: string;
}

export function MessageList({ conversationId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages' as any)
        .select(`
          id,
          body,
          sender_id,
          sent_at,
          status,
          message_reads(user_id)
        `)
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (!data) return [];

      return data.map((m: any) => ({
        ...m,
        read_by: m.message_reads?.map((r: any) => r.user_id) || [],
      }));
    },
    enabled: !!conversationId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await supabase.rpc('mark_read' as any, {
        p_conversation_id: conversationId,
        p_message_id: messageId,
      });
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark latest message as read
  useEffect(() => {
    if (messages && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.sender_id !== session?.user?.id) {
        markReadMutation.mutate(latestMessage.id);
      }
    }
  }, [messages, session]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-sm text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((message, idx) => {
        const isMe = message.sender_id === session?.user?.id;
        const showTime = idx === 0 || 
          new Date(messages[idx - 1].sent_at).getTime() < new Date(message.sent_at).getTime() - 60000;
        
        const isRead = message.read_by && message.read_by.length > 1;

        return (
          <div key={message.id} className="animate-fade-in">
            {showTime && (
              <div className="text-center text-[11px] text-muted-foreground my-3">
                {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
              </div>
            )}
            
            <div className={cn("flex items-end gap-1.5 mb-0.5", isMe ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] rounded-[18px] px-4 py-2.5 text-[14px] leading-relaxed relative",
                  isMe
                    ? "bg-[#0A84FF] text-white rounded-br-[6px]"
                    : "bg-muted text-foreground rounded-bl-[6px]"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                
                {/* Read receipt for sent messages */}
                {isMe && (
                  <div className="absolute -bottom-3 right-1 flex items-center gap-0.5">
                    {isRead ? (
                      <CheckCheck className="w-3 h-3 text-primary" />
                    ) : (
                      <Check className="w-3 h-3 text-muted-foreground/50" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
