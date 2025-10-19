import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { trackRockerMessage } from '@/lib/telemetry/events';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: any[];
}

export function useRockerChat(sessionId: string) {
  const { session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    if (!session?.userId) {
      toast.error('Please sign in to chat with Rocker');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMsg: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await supabase.functions.invoke('rocker-chat', {
        body: {
          user_id: session.userId,
          session_id: sessionId,
          message
        }
      });

      if (response.error) throw response.error;

      const { reply, actions } = response.data;
      
      // Add AI response
      const aiMsg: Message = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        actions
      };
      setMessages(prev => [...prev, aiMsg]);

      // Track telemetry
      trackRockerMessage(!!actions);

    } catch (err: any) {
      console.error('Rocker chat error:', err);
      setError(err.message || 'Failed to send message');
      toast.error('Failed to send message. Please try again.', {
        action: {
          label: 'Retry',
          onClick: () => sendMessage(message)
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
}