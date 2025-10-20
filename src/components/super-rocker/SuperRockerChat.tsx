import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: string; kind: string; key: string }>;
  created_at: string;
}

export function SuperRockerChat({ threadId }: { threadId: string | null }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadId) {
      loadMessages();
    }
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!threadId) return;

    const { data, error } = await supabase
      .from('rocker_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load messages:', error);
      return;
    }

    setMessages(data.map(m => ({
      id: m.id.toString(),
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: m.created_at,
      sources: (typeof m.meta === 'object' && m.meta && 'sources' in m.meta) 
        ? m.meta.sources as Array<{ id: string; kind: string; key: string }> 
        : undefined
    })));
  };

  const handleSend = async () => {
    if (!input.trim() || !threadId) {
      if (!threadId) {
        toast({ title: 'Please add some memory first', variant: 'destructive' });
      }
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const { data, error } = await supabase.functions.invoke('rocker-chat-simple', {
        body: {
          thread_id: threadId,
          message: userMessage
        }
      });

      if (error) throw error;

      // Refresh messages to get actual stored ones
      await loadMessages();
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!threadId) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Add some memory to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Chat with Memory</h2>
      </div>

      <ScrollArea className="flex-1 pr-4 mb-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs opacity-70 mb-1">Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src) => (
                        <Badge key={src.id} variant="outline" className="text-xs">
                          {src.kind}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          placeholder="Ask about your memory, request summaries, create tasks..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="min-h-[60px]"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="h-[60px] w-[60px]"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}