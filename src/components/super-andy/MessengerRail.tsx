import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, Loader2, Download, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { toast } from '@/hooks/use-toast';
import { VoiceControls } from './VoiceControls';
import { useAndyVoice } from '@/hooks/useAndyVoice';

interface Message {
  id: number;
  content: string;
  role: string;
  created_at: string;
}

interface MessengerRailProps {
  threadId?: string | null;
}

export function MessengerRail({ threadId: propThreadId }: MessengerRailProps) {
  const { session } = useSession();
  const [input, setInput] = useState('');
  const [localThreadId, setLocalThreadId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const lastMessageCountRef = useRef(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Use provided thread or load/create one
  const threadId = propThreadId || localThreadId;

  // Andy voice and auto-learning
  const { speakMessage, learnFromMessage, onUserActivity } = useAndyVoice({
    threadId,
    enabled: true
  });

  useEffect(() => {
    const initThread = async () => {
      if (!session?.userId) return;
      if (propThreadId) {
        setLocalThreadId(propThreadId);
        return;
      }
      
      const { data } = await supabase
        .from('rocker_threads')
        .select('id')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setLocalThreadId(data.id);
      } else {
        // Create new thread
        const { data: newThread } = await supabase
          .from('rocker_threads')
          .insert({ user_id: session.userId })
          .select('id')
          .single();
        
        if (newThread) setLocalThreadId(newThread.id);
      }
    };
    
    initThread();
  }, [session?.userId, propThreadId]);

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

      console.log('[MessengerRail] Sending to andy-chat:', { messageCount: messageHistory.length });

      // Stream response from andy-chat
      const authSession = await supabase.auth.getSession();
      if (!authSession.data.session?.access_token) {
        throw new Error('Not authenticated - please log in again');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/andy-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.data.session.access_token}`,
        },
        body: JSON.stringify({
          messages: messageHistory
        }),
      });

      console.log('[MessengerRail] andy-chat response:', response.status);

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: 'Rate limit exceeded',
            description: 'Please wait a moment and try again.',
            variant: 'destructive',
          });
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 402) {
          toast({
            title: 'AI credits required',
            description: 'Please add credits to continue using Andy.',
            variant: 'destructive',
          });
          throw new Error('Payment required');
        }
        if (response.status === 401) {
          toast({
            title: 'Authentication expired',
            description: 'Please refresh the page and log in again.',
            variant: 'destructive',
          });
          throw new Error('Authentication expired');
        }
        const errorText = await response.text();
        console.error('[MessengerRail] andy-chat error:', errorText);
        throw new Error(`Failed to get AI response: ${response.status} - ${errorText}`);
      }

      // Parse SSE stream with proper buffering
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let buffer = '';

      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
              }
            } catch (e) {
              // Skip malformed JSON chunks
              console.debug('[SSE] Skip malformed:', data.slice(0, 50));
            }
          }
        }
      }

      // Save assistant message
      if (assistantMessage) {
        const { data: newMsg } = await supabase.from('rocker_messages').insert([{
          thread_id: threadId,
          user_id: session.userId,
          content: assistantMessage,
          role: 'assistant',
        }]).select().single();

        // Speak the response
        speakMessage(assistantMessage);

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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!session?.userId) {
      toast({ title: 'Please sign in', description: 'You need to be logged in to chat with Andy.', variant: 'destructive' });
      return;
    }
    if (!threadId) {
      toast({ title: 'Preparing chat…', description: 'Setting things up, please try again in a moment.' });
      return;
    }
    if (sendMutation.isPending) return;

    const content = trimmed;

    // Trigger auto-learning before sending
    sendMutation.mutate(content);

    // Learn from the user message after it's saved
    setTimeout(async () => {
      const { data: msg } = await supabase
        .from('rocker_messages')
        .select('id')
        .eq('thread_id', threadId)
        .eq('content', content)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (msg) {
        await learnFromMessage(msg.id, content);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Send on Enter (and still support Cmd/Ctrl+Enter)
      if (!e.shiftKey || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    onUserActivity(); // Trigger silence detection
  };

  const handleTranscript = (text: string, isFinal: boolean) => {
    if (isFinal) {
      setInput(text);
      handleSend();
    }
  };

  const askAndyForQuestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('andy-ask-questions');
      if (error) throw error;
      setSuggestedQuestions(data.questions || []);
      setShowQuestions(true);
      toast({ title: 'Andy is curious!', description: 'He has some questions for you' });
    } catch (error: any) {
      console.error('Question generation error:', error);
      toast({ title: 'Failed to generate questions', description: error.message, variant: 'destructive' });
    }
  };

  const exportChatToFile = async () => {
    if (!threadId || messages.length === 0) {
      toast({ title: 'No messages to export', variant: 'destructive' });
      return;
    }

    try {
      const chatText = messages.map(m => 
        `[${m.role.toUpperCase()}] ${m.content}`
      ).join('\n\n');

      const { data, error } = await supabase.functions.invoke('rocker-ingest', {
        body: {
          text: chatText,
          subject: `Chat Export - ${new Date().toLocaleDateString()}`,
        }
      });

      if (error || (data && (data as any).error)) {
        throw new Error((data as any)?.error || (error as any)?.message || 'Failed to export chat');
      }

      toast({ 
        title: 'Chat exported to Files!', 
        description: `Filed to ${data.category} • ${data.stored} chunks`,
        duration: 5000
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({ title: 'Failed to export chat', description: error.message, variant: 'destructive' });
    }
  };


  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] bg-background rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/25">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Andy</h3>
              <p className="text-[11px] text-muted-foreground">Everything AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <VoiceControls 
              threadId={threadId}
              onTranscript={handleTranscript}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={askAndyForQuestions}
              title="Andy asks you questions"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={exportChatToFile}
              disabled={messages.length === 0}
              title="Export chat to Files"
            >
              <Download className="h-4 w-4" />
            </Button>
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
                Your everything AI with full learning, files, tasks, and proactive capabilities
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={askAndyForQuestions}
              >
                <HelpCircle className="h-3 w-3 mr-2" />
                Let Andy ask you questions
              </Button>
            </div>
          )}

          {showQuestions && suggestedQuestions.length > 0 && (
            <div className="p-3 border rounded-2xl bg-accent/30 mb-3">
              <p className="text-xs font-medium mb-2 flex items-center gap-2">
                <Brain className="h-3 w-3" />
                Andy is curious:
              </p>
              <div className="space-y-1">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q);
                      setShowQuestions(false);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs hover:bg-accent transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
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
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={session?.userId ? (threadId ? "Message Andy... (Enter to send)" : "Preparing chat…") : "Sign in to chat with Andy"}
            className="flex-1 h-10 rounded-xl"
            disabled={sendMutation.isPending || !session?.userId || !threadId}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending || !session?.userId || !threadId}
            className="h-10 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0051D5] text-white font-medium shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
