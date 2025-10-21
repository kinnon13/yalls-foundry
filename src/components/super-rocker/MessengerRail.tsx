import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Paperclip, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { toast } from 'sonner';

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

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!threadId || !content.trim() || !session?.userId) return;

      // Add user message
      await supabase.from('rocker_messages').insert([{
        thread_id: threadId,
        user_id: session.userId,
        content: content.trim(),
        role: 'user',
      }]);

      // Call Rocker edge function
      const { data, error } = await supabase.functions.invoke('rocker-chat', {
        body: { thread_id: threadId, message: content.trim() },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rocker-messages', threadId] });
      setInput('');
    },
    onError: (error: any) => {
      console.error('Send error:', error);
      toast.error('Failed to send message');
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-4 py-4 border-b border-border/40">
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

      {/* Messages */}
      <div className="flex-1 overflow-hidden px-4">
        <div ref={scrollRef} className="h-full overflow-y-auto py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-muted text-foreground'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {sendMutation.isPending && (
            <div className="flex justify-start">
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
      </div>

      {/* Composer */}
      <div className="flex-none p-4 border-t border-border/40">
        <div className="flex gap-2">
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
            placeholder="Message Andy..."
            className="h-10 rounded-xl"
            disabled={sendMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          ⌘ + Enter to send
        </p>
      </div>
    </div>
  );
}
