/**
 * Super Andy Chat with Voice
 * Super Andy chat with role-specific voice (alloy @ 1.25x)
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, MessageSquare, Mic, MicOff, Copy, CornerUpLeft, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useVoice } from '@/hooks/useVoice';
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

export function SuperAndyChatWithVoice({ 
  threadId, 
  onThreadCreated 
}: { 
  threadId: string | null; 
  onThreadCreated?: (id: string) => void 
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Super Andy voice (alloy @ 1.25x)
  const { speakAndThen, listen, stopAll, isSupported } = useVoice({
    role: 'super_andy',
    enabled: voiceEnabled,
  });

  const [isListening, setIsListening] = useState(false);
  const stopListenRef = useRef<(() => void) | null>(null);

  const toggleVoice = () => {
    if (!isSupported) {
      toast({ title: 'Voice not supported in this browser', variant: 'destructive' });
      return;
    }
    
    if (isListening) {
      if (stopListenRef.current) {
        stopListenRef.current();
        stopListenRef.current = null;
      }
      setIsListening(false);
      
      // Auto-send after stopping
      setTimeout(() => {
        if (input.trim()) {
          handleSend();
        }
      }, 300);
    } else {
      setIsListening(true);
      const cleanup = listen(
        (finalText) => {
          setInput((prev) => (prev ? `${prev} ${finalText}` : finalText));
        },
        (interimText) => {
          // Show interim transcript in placeholder or separate UI element
        }
      );
      stopListenRef.current = cleanup;
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
          const message: Message = {
            id: newMsg.id.toString(),
            role: newMsg.role,
            content: newMsg.content,
            created_at: newMsg.created_at,
            sources: newMsg.meta?.sources
          };
          setMessages(prev => [...prev, message]);
          
          // Speak assistant messages
          if (newMsg.role === 'assistant' && voiceEnabled) {
            speakAndThen(newMsg.content, () => {
              // After speaking, start listening
              const cleanup = listen(
                (finalText) => setInput((prev) => (prev ? `${prev} ${finalText}` : finalText))
              );
              stopListenRef.current = cleanup;
              setIsListening(true);
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    loadThreads();
  }, [threadId, voiceEnabled, speakAndThen, listen]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopAll();
      if (stopListenRef.current) {
        stopListenRef.current();
      }
    };
  }, [stopAll]);

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

    // Stop listening while processing
    if (stopListenRef.current) {
      stopListenRef.current();
      stopListenRef.current = null;
    }
    setIsListening(false);

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
          .insert({ user_id: user?.id, title: 'Super Andy Chat' })
          .select('id')
          .single();
        if (tErr) throw tErr;
        activeThreadId = newThread.id as string;
        onThreadCreated?.(activeThreadId);
      }

      // Stream from andy-chat (SSE) so Andy actually replies
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/andy-chat`;

      // Build full message history for better context
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const payload = { messages: [...history, { role: 'user', content: userMessage }] };

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast({ title: 'Too many requests', description: 'Please wait and try again.', variant: 'destructive' });
          return;
        }
        if (resp.status === 402) {
          toast({ title: 'AI credits required', description: 'Please add credits to continue.', variant: 'destructive' });
          return;
        }
        const txt = await resp.text();
        throw new Error(txt || 'Failed to start AI stream');
      }

      // Progressive assistant rendering
      let assistantSoFar = '';
      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: chunk, created_at: new Date().toISOString() }];
        });
      };

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            // Partial JSON, wait for more
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush any remaining buffered lines
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Speak after full response
      if (voiceEnabled && assistantSoFar) {
        speakAndThen(assistantSoFar, () => {
          const cleanup = listen((finalText) => setInput((prev) => (prev ? `${prev} ${finalText}` : finalText)));
          stopListenRef.current = cleanup;
          setIsListening(true);
        });
      }

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
          <Button
            variant={voiceEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) {
                stopAll();
                if (stopListenRef.current) {
                  stopListenRef.current();
                  stopListenRef.current = null;
                }
                setIsListening(false);
              }
            }}
          >
            {voiceEnabled ? 'Voice On' : 'Voice Off'}
          </Button>
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
          variant={isListening ? 'default' : 'outline'}
          size="icon"
          className="h-[60px] w-[60px]"
          aria-label={isListening ? 'Stop voice' : 'Start voice'}
          title={isListening ? 'Stop voice' : 'Start voice'}
          disabled={!voiceEnabled}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
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
