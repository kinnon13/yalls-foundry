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
  // Try all natural language terms for the post composer
  const terms = ['post composer', 'write a post', 'post field', 'composer', 'what\'s on your mind'];
  
  // Fast path: already mounted
  for (const term of terms) {
    try { 
      if (findElement(term)) return; 
    } catch {}
  }
  
  // Navigate to home if needed (composer lives on / for signed-in users)
  if (location.pathname !== '/') {
    history.pushState({}, '', '/');
    await delay(300);
  }
  
  // Try clicking an opener if present
  document.querySelector<HTMLElement>('[data-rocker="open post composer"]')?.click();
  
  // Wait for composer mount (longer window for hydration) - try all terms
  for (const term of terms) {
    const found = await waitForElementByName(term, 2000);
    if (found) return;
  }
}

// Helper to execute DOM actions from backend
async function executeDOMAction(action: any): Promise<{ success?: boolean; message?: string } | void> {
  console.log('[Rocker] Executing DOM action:', action);
  
  // Get userId from session
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  switch (action.action) {
    case 'dom_click': {
      const res = await clickElement(action.element_name, userId);
      return res;
    }
    
    case 'dom_fill': {
      const res = await fillField(action.field_name, action.value, userId);
      return res;
    }
    
    case 'dom_create_post': {
      if (!userId) {
        console.warn('[Rocker] No user session for dom_create_post');
      }
      await ensureComposer(userId);
      
      // Try all natural language terms for the post field
      const terms = ['post composer', 'write a post', 'post field', 'composer'];
      let fillRes: any = null;
      
      for (const term of terms) {
        fillRes = await fillField(term, action.content, userId);
        if (fillRes?.success) break;
      }
      
      if (!fillRes?.success) {
        console.warn('[Rocker] Fill failed, using clipboard fallback:', fillRes?.message);
        try { await navigator.clipboard.writeText(action.content ?? ''); } catch {}
        return { success: false, message: fillRes?.message || 'Failed to locate post field' };
      } else {
        await delay(120);
        const clickRes = await clickElement('post button', userId);
        return clickRes?.success ? { success: true, message: 'Post submitted' } : (clickRes || { success: false, message: 'Failed to click post button' });
      }
    }
    
    case 'dom_scroll': {
      window.scrollBy({ 
        top: action.direction === 'down' ? window.innerHeight : -window.innerHeight,
        behavior: 'smooth'
      });
      return { success: true };
    }
    
    case 'dom_get_page_info': {
      console.log('[Rocker] Getting page info...');
      return { success: true };
    }
    
    case 'dom_get_page_elements': {
      const elementType = action.element_type || 'all';
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        type: 'button',
        text: btn.textContent?.trim(),
        'data-rocker': btn.getAttribute('data-rocker'),
        'aria-label': btn.getAttribute('aria-label'),
        id: btn.id
      }));
      
      const fields = Array.from(document.querySelectorAll('input, textarea, select')).map(field => ({
        type: field.tagName.toLowerCase(),
        name: field.getAttribute('name'),
        placeholder: field.getAttribute('placeholder'),
        'data-rocker': field.getAttribute('data-rocker'),
        'aria-label': field.getAttribute('aria-label'),
        id: field.id
      }));
      
      const links = Array.from(document.querySelectorAll('a')).map(link => ({
        type: 'link',
        text: link.textContent?.trim(),
        href: link.getAttribute('href'),
        'aria-label': link.getAttribute('aria-label')
      }));
      
      let elements: any[] = [];
      if (elementType === 'buttons') elements = buttons;
      else if (elementType === 'fields') elements = fields;
      else if (elementType === 'links') elements = links;
      else elements = [...buttons, ...fields, ...links];
      
      console.log('[Rocker] Page elements:', elements);
      
      // Store this info in localStorage so backend can access it
      try {
        localStorage.setItem('__rocker_page_elements', JSON.stringify({
          route: window.location.pathname,
          elements,
          timestamp: new Date().toISOString()
        }));
      } catch {}
      return { success: true, message: `Captured ${elements.length} elements` };
    }
    
    default:
      console.warn('[Rocker] Unknown DOM action:', action.action);
      return { success: false, message: 'Unknown DOM action' };
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
  const lastFailuresRef = useRef<string[]>([]);
  const isCorrectionMessage = useCallback((text: string) => {
    const t = text.toLowerCase();
    return /\bwrong\b|\bnot the right\b|\bnot that\b|\buse .* instead\b|\bother (button|field)\b|\bthat’s not it\b/.test(t);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Check if there's a failure context to include
    const failureContext = sessionStorage.getItem('rocker:failure-context');
    let enhancedContent = content.trim();
    
    if (failureContext) {
      try {
        const context = JSON.parse(failureContext);
        console.log('[Rocker] Including failure context:', context);
        enhancedContent = `${content}\n\n[Failure Context: Action "${context.action}" failed because: ${context.reason}. Route: ${context.route}. Entity: ${JSON.stringify(context.entityData)}]`;
        // Keep context for follow-up messages in this conversation
      } catch (e) {
        console.error('[Rocker] Error parsing failure context:', e);
      }
    }

    // Add user message immediately
    const userMessage: RockerMessage = {
      role: 'user',
      content: enhancedContent,
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

      // If the user is correcting a failed attempt, log it immediately
      try {
        if (isCorrectionMessage(content) && lastFailuresRef.current.length > 0) {
          await supabase.from('ai_feedback').insert({
            user_id: session.user.id,
            kind: 'user_correction',
            payload: {
              correction_text: content.trim(),
              targets: lastFailuresRef.current,
              page: window.location.pathname,
              timestamp: new Date().toISOString()
            }
          });
          lastFailuresRef.current = [];
          // Clear failure context after correction is logged
          sessionStorage.removeItem('rocker:failure-context');
        }
      } catch (e) {
        console.warn('[Rocker] Failed to log user correction', e);
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
              actor_role: mode === 'admin' ? 'admin' : 'user'
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
        const failures: string[] = [];
        for (const clientAction of result.client_actions) {
          const actionRes = await executeDOMAction(clientAction);
          if (actionRes && actionRes.success === false) {
            const target = clientAction.element_name || clientAction.field_name || clientAction.target_name || clientAction.action;
            failures.push(`${target}: ${actionRes.message || 'not found'}`);
            try { lastFailuresRef.current.push(target); } catch {}
          }
        }
        if (failures.length > 0) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I couldn’t find some elements: ${failures.join('; ')}.\nPlease tell me the exact label or what it says on the button/field, or point me to it and I’ll learn it. I’ve logged this failure for training.`,
            timestamp: new Date()
          }]);
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
