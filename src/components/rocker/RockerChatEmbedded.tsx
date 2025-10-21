/**
 * Rocker Chat Embedded Component
 * 
 * Embedded version of chat UI for admin panels - always visible, no floating widget.
 */

import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RockerQuickActions } from './RockerQuickActions';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { CapabilityHighlighter } from './CapabilityHighlighter';
import { useRockerGlobal } from '@/lib/ai/rocker';
import { useSession } from '@/lib/auth/context';
import { AIRole, AI_PROFILES } from '@/lib/ai/rocker/config';
import { useVoice } from '@/hooks/useVoice';
import { VoiceRole } from '@/config/voiceProfiles';

interface RockerChatEmbeddedProps {
  actorRole?: AIRole;
}

export function RockerChatEmbedded({ actorRole }: RockerChatEmbeddedProps = {}) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    loadConversation,
    createNewConversation,
    setActorRole,
  } = useRockerGlobal();
  
  const { session } = useSession();
  const aiProfile = AI_PROFILES[actorRole || 'user'];

  // Determine voice role based on actor role
  const voiceRole: VoiceRole = actorRole === 'admin' ? 'admin_rocker' : actorRole === 'knower' ? 'super_andy' : 'user_rocker';
  const [voiceEnabled] = useState(false); // Voice disabled by default in embedded chat
  
  // Use role-specific voice
  const { stopAll } = useVoice({
    role: voiceRole,
    enabled: voiceEnabled,
  });

  const [showSidebar, setShowSidebar] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Set actor role when component mounts
  useEffect(() => {
    if (actorRole) {
      setActorRole(actorRole);
    }
    
    return () => stopAll();
  }, [actorRole, setActorRole, stopAll]);

  // Listen for session events
  useEffect(() => {
    const handleLoadSession = async (e: CustomEvent) => {
      const sessionId = e.detail?.sessionId;
      if (sessionId) {
        setCurrentSessionId(sessionId);
        await loadConversation(sessionId);
      }
    };

    const handleSendMessage = async (e: CustomEvent) => {
      const message = e.detail?.message;
      if (message) {
        const response = await sendMessage(message, currentSessionId);
        if (response?.sessionId && !currentSessionId) {
          setCurrentSessionId(response.sessionId);
        }
      }
    };

    window.addEventListener('rocker-load-session' as any, handleLoadSession);
    window.addEventListener('rocker-send-message' as any, handleSendMessage);
    
    return () => {
      window.removeEventListener('rocker-load-session' as any, handleLoadSession);
      window.removeEventListener('rocker-send-message' as any, handleSendMessage);
    };
  }, [loadConversation, sendMessage, currentSessionId]);

  // Auto-scroll on new messages
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
      window.dispatchEvent(new CustomEvent('rocker-load-session', { detail: { sessionId: newId } }));
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    window.dispatchEvent(new CustomEvent('rocker-load-session', { detail: { sessionId } }));
  };

  return (
    <div className="flex w-full h-full bg-background border border-border rounded-lg overflow-hidden">
      {showSidebar && (
        <div className="w-64 flex-shrink-0 border-r">
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
          isVoiceMode={false}
          isAlwaysListening={false}
          voiceStatus="disconnected"
          onToggleVoiceMode={() => {}}
          onToggleAlwaysListening={() => {}}
          onClearMessages={clearMessages}
          onMinimize={() => {}} // No-op for embedded
          onClose={() => {}} // No-op for embedded
          hasMessages={messages.length > 0}
          isLoading={isLoading}
          actorRole={actorRole}
        />

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col h-full">
              <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground">
                <img 
                  src={new URL('@/assets/rocker-cowboy.jpeg', import.meta.url).href}
                  alt={aiProfile.name}
                  className="h-20 w-20 rounded-full mb-4 object-cover"
                />
                <p className="text-sm font-semibold">Ready to assist you</p>
                <p className="text-xs mt-2">Start a conversation!</p>
              </div>
              <RockerQuickActions onSelectPrompt={handleQuickAction} />
            </div>
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              isVoiceMode={false}
              voiceStatus="disconnected"
              voiceTranscript=""
              isAlwaysListening={false}
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
