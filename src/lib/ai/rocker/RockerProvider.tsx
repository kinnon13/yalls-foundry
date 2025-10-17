/**
 * Rocker Provider (Thin Context Shell)
 * Production-grade provider with zero business logic (<150 LOC)
 */

import { createContext, useContext, ReactNode } from 'react';
import type { RockerContextValue } from './types';
import { useMessageStore } from './state/messageStore';
import { useRockerVoice } from './voice/useRockerVoice';
import { useRockerMode } from './mode/useRockerMode';
import { useRockerChat } from './chat/useRockerChat';
import { useComposerAwareness } from '@/hooks/useComposerAwareness';

const RockerContext = createContext<RockerContextValue | null>(null);

export function useRockerGlobal() {
  const context = useContext(RockerContext);
  if (!context) {
    throw new Error('useRockerGlobal must be used within RockerProvider');
  }
  return context;
}

export function RockerProvider({ children }: { children: ReactNode }) {
  const messageState = useMessageStore();
  const voiceState = useRockerVoice();
  const modeState = useRockerMode();
  const chatState = useRockerChat();
  const composerAwareness = useComposerAwareness();

  const value: RockerContextValue = {
    // Chat state
    messages: messageState.messages,
    isLoading: messageState.isLoading,
    error: messageState.error,
    sendMessage: chatState.sendMessage,
    clearMessages: messageState.clearMessages,
    loadConversation: chatState.loadConversation,
    createNewConversation: chatState.createNewConversation,
    
    // Mode control
    actorRole: modeState.actorRole,
    setActorRole: modeState.setActorRole,
    
    // Voice state
    isVoiceMode: voiceState.isVoiceMode,
    isAlwaysListening: voiceState.isAlwaysListening,
    voiceStatus: voiceState.voiceStatus,
    voiceTranscript: voiceState.voiceTranscript,
    toggleVoiceMode: voiceState.toggleVoiceMode,
    toggleAlwaysListening: voiceState.toggleAlwaysListening,
    
    // UI state
    isOpen: modeState.isOpen,
    setIsOpen: modeState.setIsOpen,
    
    // Composer awareness
    composerState: composerAwareness,
  };

  return (
    <RockerContext.Provider value={value}>
      {children}
    </RockerContext.Provider>
  );
}
