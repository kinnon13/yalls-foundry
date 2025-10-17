/**
 * Rocker Message State (Zustand)
 * Production-grade message management with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RockerMessage } from '@/hooks/useRocker';

interface MessageState {
  messages: RockerMessage[];
  isLoading: boolean;
  error: string | null;
  currentSessionId: string | null;
  
  // Actions
  addMessage: (message: RockerMessage) => void;
  setMessages: (messages: RockerMessage[]) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionId: (id: string | null) => void;
}

export const useMessageStore = create<MessageState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      error: null,
      currentSessionId: null,
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      
      setMessages: (messages) => set({ messages }),
      
      clearMessages: () => set({ messages: [], currentSessionId: null }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setSessionId: (id) => set({ currentSessionId: id }),
    }),
    {
      name: 'rocker-messages',
      partialize: (state) => ({ currentSessionId: state.currentSessionId }),
    }
  )
);
