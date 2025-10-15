/**
 * Rocker Chat UI Component
 * 
 * Pure UI component that connects to global Rocker context.
 * Single instance persists across all pages.
 */

import { useRef, useEffect, useState } from 'react';
import { MessageCircle, Send, X, Loader2, Trash2, Mic, MicOff, Paperclip, Link as LinkIcon, Minus, History, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RockerQuickActions } from './RockerQuickActions';
import { GoogleDriveButton } from './GoogleDriveButton';
import { RockerMessageActions } from './RockerMessageActions';
import { ConversationSidebar } from './ConversationSidebar';
import { cn } from '@/lib/utils';
import { useRockerGlobal } from '@/lib/ai/rocker/context';

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
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load persistent always listening preference and check one-time voice authorization
  useEffect(() => {
    const savedPreference = localStorage.getItem('rocker-always-listening');
    const voiceAuthorized = localStorage.getItem('rocker-voice-authorized');
    
    if (savedPreference === 'true' && !isAlwaysListening) {
      toggleAlwaysListening();
    }
    
    // Auto-enable voice if previously authorized and user wants always listening
    if (voiceAuthorized === 'true' && savedPreference === 'true' && !isVoiceMode) {
      toggleVoiceMode();
    }
  }, []);

  // Listen for session load events from profile or sidebar
  useEffect(() => {
    const handleOpenSession = (e: CustomEvent) => {
      const sessionId = e.detail?.sessionId;
      if (sessionId) {
        setCurrentSessionId(sessionId);
        setIsOpen(true);
        localStorage.removeItem('rocker-load-session');
      }
    };

    const handleLoadSession = (e: CustomEvent) => {
      const sessionId = e.detail?.sessionId;
      if (sessionId) {
        setCurrentSessionId(sessionId);
      }
    };

    window.addEventListener('rocker-open-session' as any, handleOpenSession);
    window.addEventListener('rocker-load-session' as any, handleLoadSession);
    
    // Check if there's a pending session load
    const pendingSession = localStorage.getItem('rocker-load-session');
    if (pendingSession) {
      setCurrentSessionId(pendingSession);
      setIsOpen(true);
      localStorage.removeItem('rocker-load-session');
    }

    return () => {
      window.removeEventListener('rocker-open-session' as any, handleOpenSession);
      window.removeEventListener('rocker-load-session' as any, handleLoadSession);
    };
  }, [setIsOpen]);

  // Save always listening preference and voice authorization
  useEffect(() => {
    localStorage.setItem('rocker-always-listening', isAlwaysListening.toString());
    
    // Mark voice as authorized once user enables it
    if (isVoiceMode) {
      localStorage.setItem('rocker-voice-authorized', 'true');
    }
  }, [isAlwaysListening, isVoiceMode]);

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
    const response = await sendMessage(message, currentSessionId);
    
    // Update session ID from response if new conversation
    if (response?.sessionId && !currentSessionId) {
      setCurrentSessionId(response.sessionId);
    }
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

  const handleNewConversation = () => {
    setCurrentSessionId(undefined);
    clearMessages();
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Trigger session load via custom event
    window.dispatchEvent(new CustomEvent('rocker-load-session', { detail: { sessionId } }));
  };

  if (!isOpen || isMinimized) {
    return (
      <Button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
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
    <div className="fixed bottom-6 right-6 z-50 flex w-[1000px] h-[600px] bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 flex-shrink-0">
          <ConversationSidebar
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewConversation={handleNewConversation}
          />
        </div>
      )}
      
      {/* Main Chat */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              title="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
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
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 && !isVoiceMode ? (
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
              {/* Voice Mode Status (shown at top when active) */}
              {isVoiceMode && (
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border border-border">
                  <div className={cn(
                    "mb-2 transition-all",
                    voiceStatus === 'connected' && "scale-110 animate-pulse"
                  )}>
                    <img 
                      src={new URL('@/assets/rocker-cowboy-avatar.jpeg', import.meta.url).href}
                      alt="Rocker listening"
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-semibold">
                    {voiceStatus === 'connected' ? '🎤 Listening...' : 'Connecting...'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAlwaysListening 
                      ? 'Say "Hey Rocker" or type below' 
                      : 'Speak or type your message'}
                  </p>
                  {voiceTranscript && (
                    <div className="mt-2 bg-background rounded-lg p-2 w-full">
                      <p className="text-xs text-muted-foreground italic">"{voiceTranscript}"</p>
                    </div>
                  )}
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex gap-3 group',
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
                    <div className="flex items-start gap-2 flex-1 min-w-0">
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
                      
                      {message.role === 'assistant' && (
                        <RockerMessageActions 
                          messageIndex={index}
                          messageContent={message.content}
                        />
                      )}
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

        {/* Input - Always shown */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*,application/pdf,.csv,.txt,.doc,.docx';
                    fileInput.onchange = async (e: Event) => {
                      const target = e.target as HTMLInputElement;
                      const file = target.files?.[0];
                      if (file) {
                        sendMessage(`[Uploaded file: ${file.name}] Please analyze this file.`, currentSessionId);
                      }
                    };
                    fileInput.click();
                  }}
                  title="Upload file (image, PDF, CSV, document)"
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  File
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = prompt('Enter website URL to analyze:');
                    if (url) {
                      sendMessage(`Fetch and analyze this URL: ${url}`, currentSessionId);
                    }
                  }}
                  title="Fetch and analyze website URL"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  URL
                </Button>
                <GoogleDriveButton />
              </div>
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Rocker anything..."
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
            </div>
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
            {isVoiceMode 
              ? 'Voice mode active - you can also type or upload files'
              : 'Press Enter to send, Shift+Enter for new line'}
          </p>
        </div>
      </div>
    </div>
  );
}
