/**
 * Rocker Chat Hook
 * Production-grade chat operations (send, load, create)
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMessageStore } from '../state/messageStore';
import type { RockerMessage } from '@/hooks/useRocker';

export function useRockerChat() {
  const { addMessage, setMessages, setLoading, setError, setSessionId } = useMessageStore();

  const sendMessage = useCallback(async (
    content: string,
    sessionId?: string
  ): Promise<{ sessionId?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Add user message
      const userMessage: RockerMessage = {
        role: 'user',
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // TODO: Call Lovable AI via edge function
      // For now, mock response
      const assistantMessage: RockerMessage = {
        role: 'assistant',
        content: 'This is a placeholder response. Integrate with Lovable AI.',
        timestamp: new Date(),
      };
      
      setTimeout(() => {
        addMessage(assistantMessage);
        setLoading(false);
      }, 500);

      return { sessionId: sessionId || crypto.randomUUID() };
    } catch (error) {
      console.error('[Rocker Chat] Send error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setLoading(false);
      throw error;
    }
  }, [addMessage, setLoading, setError]);

  const loadConversation = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setLoading(true);
      
      const { data, error } = await (supabase as any)
        .from('conversation_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      setSessionId(sessionId);
    } catch (error) {
      console.error('[Rocker Chat] Load error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [setMessages, setSessionId, setLoading, setError]);

  const createNewConversation = useCallback(async (): Promise<string | undefined> => {
    try {
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      return newSessionId;
    } catch (error) {
      console.error('[Rocker Chat] Create error:', error);
      return undefined;
    }
  }, [setSessionId]);

  return {
    sendMessage,
    loadConversation,
    createNewConversation,
  };
}
