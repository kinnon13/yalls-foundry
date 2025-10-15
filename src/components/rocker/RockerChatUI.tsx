/**
 * Rocker Chat UI Component
 * 
 * Pure UI component that connects to global Rocker context.
 * Single instance persists across all pages.
 */

import { useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Trash2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RockerQuickActions } from './RockerQuickActions';
import { cn } from '@/lib/utils';
import { useRockerGlobal } from '@/lib/ai/rocker/context';
import { useState } from 'react';

export function RockerChatUI() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    isVoiceMode,
    isAlwaysListening,
    voiceStatus,
    voiceTranscript,
    toggleVoiceMode,
    toggleAlwaysListening,
    isOpen,
    setIsOpen,
  } = useRockerGlobal();

  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current && !isVoiceMode) {
      textareaRef.current.focus();
    }
  }, [isOpen, isVoiceMode]);

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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0 overflow-hidden"
        aria-label="Open Rocker Chat"
      >
        <img 
          src={new URL('@/assets/rocker-cowboy-avatar.jpeg', import.meta.url).href}
          alt="Rocker"
          className="h-full w-full object-cover"
        />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-96 h-[600px] bg-background border border-border rounded-lg shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src={new URL('@/assets/rocker-cowboy-avatar.jpeg', import.meta.url).href} 
            alt="Rocker" 
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">Rocker</h3>
            <p className="text-xs text-muted-foreground">Your AI sidekick</p>
          </div>
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
            variant={isAlwaysListening ? "default" : "ghost"}
            size="icon"
            onClick={toggleAlwaysListening}
            disabled={isLoading}
            title={isAlwaysListening ? "Disable always listening" : "Enable always listening"}
            className={cn(
              isAlwaysListening && "animate-pulse"
            )}
          >
            <Mic className="h-4 w-4" />
          </Button>
          {!isAlwaysListening && (
            <Button
              variant={isVoiceMode ? "default" : "ghost"}
              size="icon"
              onClick={toggleVoiceMode}
              disabled={isLoading}
              title={isVoiceMode ? "Stop voice mode" : "Start voice mode"}
            >
              {isVoiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
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
              voiceStatus === 'connected' && "scale-110 animate-pulse"
            )}>
              <img 
                src={new URL('@/assets/rocker-cowboy-avatar.jpeg', import.meta.url).href}
                alt="Rocker listening"
                className="h-24 w-24 rounded-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold mb-2">
              {voiceStatus === 'connected' ? 'Listening...' : 'Connecting...'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {isAlwaysListening 
                ? 'Say "Hey Rocker" to get my attention' 
                : 'Speak naturally to Rocker'}
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
              <img 
                src={new URL('@/assets/rocker-cowboy.jpeg', import.meta.url).href}
                alt="Rocker"
                className="h-20 w-20 rounded-full mb-4 object-cover"
              />
              <p className="text-sm font-semibold">Hey there! I'm Rocker, your AI sidekick.</p>
              <p className="text-xs mt-2">I can help you navigate, save posts, find content, create events, and more!</p>
            </div>
            <RockerQuickActions onSelectPrompt={handleQuickAction} />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 
                  message.role === 'system' ? 'justify-center' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={new URL('@/assets/rocker-cowboy.jpeg', import.meta.url).href} alt="Rocker" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                
                {message.role === 'system' ? (
                  <div className="max-w-[60%] rounded-full px-4 py-1 bg-muted/50 border border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-4 py-2',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.metadata?.url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => window.location.href = message.metadata!.url!}
                      >
                        View →
                      </Button>
                    )}
                    
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                )}
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
              onClick={handleSend}
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
