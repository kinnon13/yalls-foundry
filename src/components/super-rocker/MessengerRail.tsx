import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Paperclip, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: number;
  content: string;
  role: string;
  created_at: string;
}

export function MessengerRail() {
  const { session } = useSession();
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const lastMessageCountRef = useRef(0);

  // Load or create thread
  useEffect(() => {
    const initThread = async () => {
      if (!session?.userId) return;
      
      const { data } = await supabase
        .from('rocker_threads')
        .select('id')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setThreadId(data.id);
      } else {
        // Create new thread
        const { data: newThread } = await supabase
          .from('rocker_threads')
          .insert({ user_id: session.userId })
          .select('id')
          .single();
        
        if (newThread) setThreadId(newThread.id);
      }
    };
    
    initThread();
  }, [session?.userId]);

  // Load messages
  const { data: messages = [] } = useQuery({
    queryKey: ['rocker-messages', threadId],
    queryFn: async () => {
      if (!threadId) return [];
      
      const { data, error } = await supabase
        .from('rocker_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!threadId,
  });

  // Send message mutation with streaming
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!threadId || !content.trim() || !session?.userId) return;

      // Add user message to DB
      const { error: insertError } = await supabase.from('rocker_messages').insert([{
        thread_id: threadId,
        user_id: session.userId,
        content: content.trim(),
        role: 'user',
      }]);

      if (insertError) throw insertError;

      // Invalidate to show user message immediately
      queryClient.invalidateQueries({ queryKey: ['rocker-messages', threadId] });

      // Build message history for AI
      const messageHistory = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: content.trim() }
      ];

      // Stream response from rocker-chat
      const SUPABASE_URL = 'https://xuxfuonzsfvrirdwzddt.supabase.co';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/rocker-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: messageHistory,
          actor_role: 'user'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('rocker-chat error:', errorText);
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      // Parse SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
              }
            } catch (e) {
              console.log('Parse error (partial data):', e);
            }
          }
        }
      }

      // Save assistant message
      if (assistantMessage) {
        await supabase.from('rocker_messages').insert([{
          thread_id: threadId,
          user_id: session.userId,
          content: assistantMessage,
          role: 'assistant',
        }]);

        toast({
          title: 'Andy replied',
          description: assistantMessage.slice(0, 100) + (assistantMessage.length > 100 ? '...' : ''),
          duration: 4000,
        });
      }

      return assistantMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rocker-messages', threadId] });
      setInput('');
    },
    onError: (error: any) => {
      console.error('Send error:', error);
      toast({
        title: 'Failed to send message',
        description: error?.message ? String(error.message) : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    if (messages.length > lastMessageCountRef.current) {
      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !sendMutation.isPending) {
      sendMutation.mutate(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] bg-background rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/25">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Andy</h3>
            <p className="text-[11px] text-muted-foreground">AI Assistant</p>
          </div>
          <div className="ml-auto">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Messages - scrollable area */}
      <div 
        ref={scrollRef} 
        className="min-h-0 h-full overflow-y-auto px-4 py-4 space-y-3"
        style={{ scrollbarGutter: 'stable' }}
      >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Chat with Andy</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Your AI assistant is ready to help with tasks, knowledge, and more
              </p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug break-words whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-[#007AFF] text-white shadow-sm'
                    : 'bg-muted text-foreground'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {sendMutation.isPending && (
            <div className="flex justify-start px-2">
              <div className="bg-muted rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Composer - pinned at bottom */}
      <div 
        className="flex-none border-t border-border/40 px-4 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Andy... (⌘⏎ to send)"
            className="flex-1 h-10 rounded-xl"
            disabled={sendMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="h-10 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0051D5] text-white font-medium shrink-0"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
