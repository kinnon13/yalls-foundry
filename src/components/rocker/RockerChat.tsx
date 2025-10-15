import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Trash2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRocker } from '@/hooks/useRocker';
import { RockerQuickActions } from './RockerQuickActions';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeVoice } from '@/utils/RealtimeAudio';
import { useToast } from '@/hooks/use-toast';

export function RockerChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, error, sendMessage, cancelRequest, clearMessages } = useRocker();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const voiceRef = useRef<RealtimeVoice | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const toggleVoiceMode = async () => {
    if (isVoiceMode) {
      // Stop voice mode
      voiceRef.current?.disconnect();
      voiceRef.current = null;
      setIsVoiceMode(false);
      setVoiceStatus('disconnected');
      setVoiceTranscript('');
    } else {
      // Start voice mode
      try {
        setVoiceStatus('connecting');
        
        // Get ephemeral token
        const { data, error } = await supabase.functions.invoke('rocker-voice-session');
        
        if (error) throw error;
        if (!data.client_secret?.value) throw new Error('No ephemeral token received');

        // Initialize voice connection
        const voice = new RealtimeVoice(
          (status) => setVoiceStatus(status),
          (text, isFinal) => {
            if (isFinal) {
              setVoiceTranscript('');
            } else {
              setVoiceTranscript(text);
            }
          }
        );

        await voice.connect(data.client_secret.value);
        voiceRef.current = voice;
        setIsVoiceMode(true);
        
        toast({
          title: "Voice mode active",
          description: "Start speaking to Rocker!",
        });
      } catch (error) {
        console.error('Error starting voice mode:', error);
        toast({
          title: "Voice mode failed",
          description: error instanceof Error ? error.message : 'Failed to start voice mode',
          variant: "destructive",
        });
        setVoiceStatus('disconnected');
        setIsVoiceMode(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      voiceRef.current?.disconnect();
    };
  }, []);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        aria-label="Open Rocker Chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-96 h-[600px] bg-background border border-border rounded-lg shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Rocker AI</h3>
          {isVoiceMode && (
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              voiceStatus === 'connected' && "bg-green-500/20 text-green-700 dark:text-green-400",
              voiceStatus === 'connecting' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
              voiceStatus === 'disconnected' && "bg-gray-500/20 text-gray-700 dark:text-gray-400"
            )}>
              {voiceStatus === 'connected' ? '🎤 Listening' : voiceStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={isVoiceMode ? "default" : "ghost"}
            size="icon"
            onClick={toggleVoiceMode}
            disabled={isLoading}
            title={isVoiceMode ? "Stop voice mode" : "Start voice mode"}
          >
            {isVoiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          {messages.length > 0 && !isVoiceMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              disabled={isLoading}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isVoiceMode ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={cn(
              "mb-4 transition-all",
              voiceStatus === 'connected' && "scale-110"
            )}>
              <Mic className="h-16 w-16 text-primary" />
            </div>
            <p className="text-sm font-semibold mb-2">
              {voiceStatus === 'connected' ? 'Listening...' : 'Connecting...'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Speak naturally to Rocker
            </p>
            {voiceTranscript && (
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <p className="text-sm text-muted-foreground italic">"{voiceTranscript}"</p>
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm font-semibold">Hey there! I'm Rocker, your AI assistant.</p>
              <p className="text-xs mt-2">I can help you save posts, find content, create events, and more!</p>
            </div>
            <RockerQuickActions onSelectPrompt={handleQuickAction} />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t border-destructive/20">
          {error}
        </div>
      )}

      {/* Input */}
      {!isVoiceMode && (
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Rocker anything..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={isLoading ? cancelRequest : handleSend}
              disabled={!inputValue.trim() && !isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <X className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
