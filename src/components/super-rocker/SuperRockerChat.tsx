import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, MessageSquare, Mic, MicOff, Copy, CornerUpLeft, Check, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSpeech } from '@/hooks/useSpeech';
import { OrganizeButton } from './OrganizeButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: string; kind: string; key: string }>;
  created_at: string;
}

interface Thread {
  id: string;
  title: string;
  created_at: string;
}

export function SuperRockerChat({ threadId, onThreadCreated }: { threadId: string | null; onThreadCreated?: (id: string) => void }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [threads, setThreads] = useState<Thread[]>([]);

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
      // Subscribe to realtime proactive messages
      const channel = supabase
        .channel(`thread:${threadId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'rocker_messages',
          filter: `thread_id=eq.${threadId}`
        }, (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMsg.id.toString(),
            role: newMsg.role,
            content: newMsg.content,
            created_at: newMsg.created_at,
            sources: newMsg.meta?.sources
          }]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    loadThreads();
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadThreads = async () => {
    const { data } = await supabase
      .from('rocker_threads')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setThreads(data);
  };

  const loadMessages = async (tid: string | null = threadId) => {
    if (!tid) return;

    const { data, error } = await supabase
      .from('rocker_messages')
      .select('*')
      .eq('thread_id', tid)
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

      const { data, error } = await supabase.functions.invoke('rocker-chat-simple', {
        body: {
          thread_id: activeThreadId,
          message: userMessage
        }
      });

      if (error) throw error;

      // Show tool results if any
      if (data?.tool_results && data.tool_results.length > 0) {
        const toolSummary = data.tool_results
          .map((t: any) => `✅ ${t.tool}: ${t.result}`)
          .join(' · ');
        toast({
          title: 'Actions completed',
          description: toolSummary,
        });
      }

      // Refresh messages to get actual stored ones
      await loadMessages(activeThreadId);
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

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: 'Copied to clipboard' });
    } catch (error) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const referenceMessage = (message: Message) => {
    setInput(`Regarding your previous message: "${message.content.slice(0, 100)}${message.content.length > 100 ? '...' : ''}" - `);
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Chat with Memory</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={threadId || ''} onValueChange={(val) => onThreadCreated?.(val)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select thread..." />
            </SelectTrigger>
            <SelectContent>
              {threads.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title || 'Untitled'} ({new Date(t.created_at).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <OrganizeButton threadId={threadId} />
        </div>
      </div>


      <ScrollArea className="flex-1 pr-4 mb-4" style={{ height: 'calc(100% - 120px)' }}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
            >
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div
                  className={`rounded-lg p-3 ${
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
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="h-7"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span className="ml-1 text-xs">Copy</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => referenceMessage(msg)}
                      className="h-7"
                    >
                      <CornerUpLeft className="h-3 w-3" />
                      <span className="ml-1 text-xs">Reference</span>
                    </Button>
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