import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clickElement, fillField, findElement } from '@/lib/ai/rocker/dom-agent';

// Helper utilities for DOM actions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function waitForElementByName(name: string, timeoutMs = 7000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const el = findElement(name);
      if (el) return true;
    } catch {}
    await delay(150);
  }
  return false;
}
async function ensureComposer(userId?: string) {
  // Fast path: already mounted
  try { if (findElement('post field')) return; } catch {}
  // Navigate to home if needed (composer lives on / for signed-in users)
  if (location.pathname !== '/') {
    history.pushState({}, '', '/');
    await delay(300);
  }
  // Try clicking an opener if present
  document.querySelector<HTMLElement>('[data-rocker="open post composer"]')?.click();
  // Wait for composer mount (longer window for hydration)
  await waitForElementByName('post field', 7000);
}

// Helper to execute DOM actions from backend
async function executeDOMAction(action: any) {
  console.log('[Rocker] Executing DOM action:', action);
  
  // Get userId from session
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  switch (action.action) {
    case 'dom_click':
      await clickElement(action.element_name, userId);
      break;
      
    case 'dom_fill':
      await fillField(action.field_name, action.value, userId);
      break;
      
    case 'dom_create_post': {
      if (!userId) {
        console.warn('[Rocker] No user session for dom_create_post');
      }
      await ensureComposer(userId);
      const fillRes = await fillField('post field', action.content, userId);
      if (!fillRes?.success) {
        console.warn('[Rocker] Fill failed, using clipboard fallback:', fillRes?.message);
        try { await navigator.clipboard.writeText(action.content ?? ''); } catch {}
      } else {
        await delay(120);
        await clickElement('post button', userId);
      }
      break;
    }
      
    case 'dom_scroll':
      window.scrollBy({ 
        top: action.direction === 'down' ? window.innerHeight : -window.innerHeight,
        behavior: 'smooth'
      });
      break;
      
    case 'dom_get_page_info':
      // This would be handled server-side or return info to chat
      console.log('[Rocker] Getting page info...');
      break;
      
    default:
      console.warn('[Rocker] Unknown DOM action:', action.action);
  }
}

export interface RockerMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'tool_call' | 'tool_result' | 'navigation';
    toolName?: string;
    status?: 'thinking' | 'executing' | 'complete' | 'error';
    url?: string;
    navigationPath?: string; // For navigation commands
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
            currentRoute: window.location.pathname,
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
      
      // Execute DOM actions if present
      if (result.client_actions && Array.isArray(result.client_actions)) {
        for (const clientAction of result.client_actions) {
          await executeDOMAction(clientAction);
        }
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
        
        // Handle navigation from tool calls or hints
        if (result.navigationPath) {
          assistantMessage.metadata = {
            type: 'navigation',
            navigationPath: result.navigationPath
          };
        } else if (result.navigation_url) {
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
