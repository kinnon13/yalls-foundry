/**
 * Rocker Type Definitions
 * Unified types for billion-user scale
 */

export type VoiceStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type AIRole = 'user' | 'rocker' | 'admin' | 'system';

export interface VoiceCommand {
  type: 'navigate' | 'click_element' | 'fill_field' | 'create_post' | 'scroll_page' | 'create_horse';
  path?: string;
  element_name?: string;
  field_name?: string;
  value?: string;
  content?: string;
  direction?: string;
  amount?: string;
  name?: string;
  breed?: string;
  color?: string;
  description?: string;
}

export interface ComposerAwareness {
  isTyping: boolean;
  lastSource?: string;
  lastLength?: number;
  lastSuggestion?: string;
  isLoadingSuggestion: boolean;
  shouldPauseRocker: () => boolean;
}

export interface RockerContextValue {
  // Chat state
  messages: any[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, sessionId?: string) => Promise<{ sessionId?: string }>;
  clearMessages: () => void;
  loadConversation: (sessionId: string) => Promise<void>;
  createNewConversation: () => Promise<string | undefined>;
  
  // Mode control
  actorRole: AIRole;
  setActorRole: (role: AIRole) => void;
  
  // Voice state
  isVoiceMode: boolean;
  isAlwaysListening: boolean;
  voiceStatus: VoiceStatus;
  voiceTranscript: string;
  toggleVoiceMode: () => Promise<void>;
  toggleAlwaysListening: () => Promise<void>;
  
  // UI state
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  
  // Composer awareness
  composerState: ComposerAwareness;
}
