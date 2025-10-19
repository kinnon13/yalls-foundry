/**
 * Rocker Chat UI Component
 * 
 * Pure UI component that connects to global Rocker context.
 * Single instance persists across all pages.
 */

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RockerQuickActions } from './RockerQuickActions';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { CapabilityHighlighter } from './CapabilityHighlighter';
import { useRockerGlobal } from '@/lib/ai/rocker';
import { useSession } from '@/lib/auth/context';
import { AI_PROFILES } from '@/lib/ai/rocker/config';
import { Badge } from '@/components/ui/badge';

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
    loadConversation,
    createNewConversation,
    actorRole,
  } = useRockerGlobal();
  
  const { session } = useSession();
  const aiProfile = AI_PROFILES[actorRole || 'user'];

  const [isMinimized, setIsMinimized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [showRockerLabels, setShowRockerLabels] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load label preference
  useEffect(() => {
    const checkLabels = () => {
      const labels = localStorage.getItem('show-rocker-labels') === 'true';
      setShowRockerLabels(labels);
    };
    checkLabels();
    const interval = setInterval(checkLabels, 500);
    return () => clearInterval(interval);
  }, []);

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
    const handleOpenSession = async (e: CustomEvent) => {
      const sessionId = e.detail?.sessionId;
      if (sessionId) {
        setCurrentSessionId(sessionId);
        setIsOpen(true);
        await loadConversation(sessionId);
        localStorage.removeItem('rocker-load-session');
      }
    };

    const handleLoadSession = async (e: CustomEvent) => {
      const sessionId = e.detail?.sessionId;
      if (sessionId) {
        setCurrentSessionId(sessionId);
        await loadConversation(sessionId);
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

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt, currentSessionId).then((res) => {
      if (res?.sessionId && !currentSessionId) {
        setCurrentSessionId(res.sessionId);
      }
    });
  };

  const handleNewConversation = async () => {
    const newId = await createNewConversation();
    if (newId) {
      setCurrentSessionId(newId);
      clearMessages();
      // Ensure sidebar highlights the new session
      window.dispatchEvent(new CustomEvent('rocker-load-session', { detail: { sessionId: newId } }));
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Trigger session load via custom event
    window.dispatchEvent(new CustomEvent('rocker-load-session', { detail: { sessionId } }));
  };

  if (!isOpen || isMinimized) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[1000px] h-[600px] bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
      {showSidebar && (
        <div className="w-64 flex-shrink-0">
          <ConversationSidebar
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewConversation={handleNewConversation}
          />
        </div>
      )}
      
      <div className="flex flex-col flex-1">
          <ChatHeader
            showSidebar={showSidebar}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            isVoiceMode={isVoiceMode}
            isAlwaysListening={isAlwaysListening}
            voiceStatus={voiceStatus}
            onToggleVoiceMode={toggleVoiceMode}
            onToggleAlwaysListening={toggleAlwaysListening}
            onClearMessages={clearMessages}
            onMinimize={() => setIsMinimized(true)}
            onClose={() => setIsOpen(false)}
            hasMessages={messages.length > 0}
            isLoading={isLoading}
            actorRole={actorRole}
          />

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 && !isVoiceMode ? (
            <div className="flex flex-col h-full">
              <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground">
                <img 
                  src={new URL('@/assets/rocker-cowboy.jpeg', import.meta.url).href}
                  alt={aiProfile.name}
                  className="h-20 w-20 rounded-full mb-4 object-cover"
                />
                <p className="text-sm font-semibold">Hey there! I'm {aiProfile.name}.</p>
                <p className="text-xs mt-2">{aiProfile.role}</p>
              </div>
              <RockerQuickActions onSelectPrompt={handleQuickAction} />
            </div>
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              isVoiceMode={isVoiceMode}
              voiceStatus={voiceStatus}
              voiceTranscript={voiceTranscript}
              isAlwaysListening={isAlwaysListening}
              actorRole={actorRole}
            />
          )}
        </ScrollArea>

        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t border-destructive/20">
            {error}
          </div>
        )}

        <Composer
          onSend={(message) => {
            const response = sendMessage(message, currentSessionId);
            response.then((res) => {
              if (res?.sessionId && !currentSessionId) {
                setCurrentSessionId(res.sessionId);
              }
            });
          }}
          isLoading={isLoading}
          onFileUpload={(fileName) => sendMessage(`[Uploaded file: ${fileName}] Please analyze this file.`, currentSessionId)}
          onUrlAnalyze={(url) => sendMessage(`Fetch and analyze this URL: ${url}`, currentSessionId)}
        />
      </div>
      
      {session?.userId && <CapabilityHighlighter userId={session.userId} />}
    </div>
  );
}
