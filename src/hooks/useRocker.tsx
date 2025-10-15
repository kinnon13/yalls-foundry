import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RockerMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'tool_call' | 'tool_result' | 'navigation';
    toolName?: string;
    status?: 'thinking' | 'executing' | 'complete' | 'error';
    url?: string;
  };
}

export interface RockerSession {
  id: string;
  messages: RockerMessage[];
}

export function useRocker(mode: 'user' | 'admin' | 'super_admin' = 'user') {
  const [messages, setMessages] = useState<RockerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message immediately
    const userMessage: RockerMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rocker-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            mode
          }),
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (response.status === 402) {
          throw new Error('AI usage limit reached. Please add credits to continue.');
        }
        throw new Error(`Request failed: ${response.statusText}`);
      }

      // Handle JSON response (non-streaming with tool execution)
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Add tool execution feedback if present
      if (result.tool_calls && result.tool_calls.length > 0) {
        const toolMessages: RockerMessage[] = result.tool_calls.map((tc: any) => ({
          role: 'system' as const,
          content: `🔧 ${tc.name}`,
          timestamp: new Date(),
          metadata: { 
            type: 'tool_call' as const,
            toolName: tc.name,
            status: 'complete' as const
          }
        }));
        setMessages(prev => [...prev, ...toolMessages]);
      }
      
      if (result.content) {
        const assistantMessage: RockerMessage = {
          role: 'assistant',
          content: result.content,
          timestamp: new Date()
        };
        
        // Auto-navigate if navigation hint present
        if (result.navigation_url) {
          assistantMessage.metadata = {
            type: 'navigation',
            url: result.navigation_url
          };
        }
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response from assistant');
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request cancelled');
      } else {
        setError(err.message || 'Failed to send message');
        console.error('Rocker error:', err);
      }
      // Remove incomplete assistant message on error
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content.length > 0));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, mode]);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelRequest,
    clearMessages
  };
}
