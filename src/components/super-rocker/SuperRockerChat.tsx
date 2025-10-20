import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, MessageSquare, Mic, MicOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSpeech } from '@/hooks/useSpeech';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: string; kind: string; key: string }>;
  created_at: string;
}

export function SuperRockerChat({ threadId, onThreadCreated }: { threadId: string | null; onThreadCreated?: (id: string) => void }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { start, stop, listening, supported } = useSpeech({
    onTranscript: (text, isFinal) => {
      if (isFinal) setInput((prev) => (prev ? `${prev} ${text}` : text));
    },
    onError: (err) => toast({ title: 'Voice error', description: err, variant: 'destructive' }),
  });

  const toggleVoice = () => {
    if (!supported) {
      toast({ title: 'Voice not supported in this browser', variant: 'destructive' });
      return;
    }
    if (listening) {
      stop();
      if (input.trim()) handleSend();
    } else {
      setInput('');
      start();
    }
  };

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
      sources: (m.meta && typeof m.meta === 'object' && 'sources' in m.meta) 
        ? (m.meta as any).sources as Array<{ id: string; kind: string; key: string }> 
        : undefined
    })));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

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
      // Ensure a thread exists
      let activeThreadId = threadId;
      if (!activeThreadId) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: newThread, error: tErr } = await supabase
          .from('rocker_threads')
          .insert({ user_id: user?.id, title: 'Super Rocker Chat' })
          .select('id')
          .single();
        if (tErr) throw tErr;
        activeThreadId = newThread.id as string;
        onThreadCreated?.(activeThreadId);
      }

      const { error } = await supabase.functions.invoke('rocker-chat-simple', {
        body: {
          thread_id: activeThreadId,
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
  return (
    <div className="flex flex-col min-h-[60vh] max-h-[80vh]">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Chat with Memory</h2>
      </div>

      <ScrollArea className="flex-1 min-h-0 pr-4 mb-4">
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
          onClick={toggleVoice}
          variant={listening ? 'default' : 'outline'}
          size="icon"
          className="h-[60px] w-[60px]"
          aria-label={listening ? 'Stop voice' : 'Start voice'}
          title={listening ? 'Stop voice' : 'Start voice'}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
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