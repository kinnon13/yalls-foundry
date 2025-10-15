/**
 * Rocker Global Context
 * 
 * Single persistent AI instance that follows the user across all pages.
 * Manages conversation state, voice connection, and navigation.
 */

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeVoice } from '@/utils/RealtimeAudio';
import { useToast } from '@/hooks/use-toast';
import type { RockerMessage } from '@/hooks/useRocker';
import { executeDOMAction } from './dom-agent';

interface RockerContextValue {
  // Chat state
  messages: RockerMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  
  // Voice state
  isVoiceMode: boolean;
  isAlwaysListening: boolean;
  voiceStatus: 'connecting' | 'connected' | 'disconnected';
  voiceTranscript: string;
  toggleVoiceMode: () => Promise<void>;
  toggleAlwaysListening: () => Promise<void>;
  
  // UI state
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const RockerContext = createContext<RockerContextValue | null>(null);

export function useRockerGlobal() {
  const context = useContext(RockerContext);
  if (!context) {
    throw new Error('useRockerGlobal must be used within RockerProvider');
  }
  return context;
}

export function RockerProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Chat state
  const [messages, setMessages] = useState<RockerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Voice state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isAlwaysListening, setIsAlwaysListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const voiceRef = useRef<RealtimeVoice | null>(null);
  const initializingRef = useRef(false);
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);

  // Handle navigation from voice or chat
  const handleNavigation = useCallback((path: string) => {
    console.log('[Rocker Navigation] Attempting to navigate to:', path);
    
    if (path === 'back') {
      console.log('[Rocker Navigation] Going back');
      navigate(-1);
      toast({ title: 'Navigating back' });
    } else {
      console.log('[Rocker Navigation] Navigating to:', path);
      // Use navigate with replace: false to ensure full navigation
      navigate(path, { replace: false });
      toast({ 
        title: 'Navigation', 
        description: `Opening ${path}`,
      });
    }
  }, [navigate, toast]);

  // Voice command handler
  const handleVoiceCommand = useCallback((cmd: { type: 'navigate'; path: string }) => {
    console.log('[Rocker Context] Voice command received:', cmd);
    
    if (cmd.type === 'navigate') {
      console.log('[Rocker Context] Processing navigation command:', cmd.path);
      
      // Small delay to ensure audio stops before navigation
      setTimeout(() => {
        handleNavigation(cmd.path);
      }, 100);
    }
  }, [handleNavigation]);

  // Initialize voice with navigation handler
  const createVoiceConnection = useCallback(async (alwaysListening: boolean) => {
    console.log('[Rocker] 🔧 createVoiceConnection called with alwaysListening:', alwaysListening);
    setVoiceStatus('connecting');
    
    console.log('[Rocker] 📡 Invoking rocker-voice-session edge function...');
    const { data, error } = await supabase.functions.invoke('rocker-voice-session', {
      body: { alwaysListening }
    });
    
    console.log('[Rocker] Response received:', { data, error });
    
    if (error) {
      console.error('[Rocker] ❌ Edge function error:', error);
      throw error;
    }
    if (!data.client_secret?.value) {
      console.error('[Rocker] ❌ No ephemeral token in response');
      throw new Error('No ephemeral token received');
    }
    
    console.log('[Rocker] ✓ Ephemeral token received, creating RealtimeVoice instance');

    const voice = new RealtimeVoice(
      (status) => setVoiceStatus(status),
      (text, isFinal) => {
        if (isFinal) {
          setVoiceTranscript('');
        } else {
          setVoiceTranscript(text);
        }
      },
      handleVoiceCommand
    );

    await voice.connect(data.client_secret.value);
    return voice;
  }, [handleVoiceCommand]);

  // Toggle voice mode
  const toggleVoiceMode = useCallback(async () => {
    if (isVoiceMode) {
      if (!isAlwaysListening) {
        voiceRef.current?.disconnect();
        voiceRef.current = null;
        setVoiceStatus('disconnected');
        setVoiceTranscript('');
      }
      setIsVoiceMode(false);
    } else {
      try {
        const voice = await createVoiceConnection(isAlwaysListening);
        voiceRef.current = voice;
        setIsVoiceMode(true);
        
        toast({
          title: "Voice mode active",
          description: isAlwaysListening ? "Say 'Hey Rocker' to get my attention" : "Start speaking to Rocker!",
        });
      } catch (error) {
        console.error('Error starting voice mode:', error);
        toast({
          title: "Voice mode failed",
          description: error instanceof Error ? error.message : 'Failed to start voice mode',
          variant: "destructive",
        });
        setVoiceStatus('disconnected');
        setIsVoiceMode(false);
      }
    }
  }, [isVoiceMode, isAlwaysListening, createVoiceConnection, toast]);

  // Toggle always listening
  const toggleAlwaysListening = useCallback(async () => {
    console.log('[Rocker] toggleAlwaysListening called', { 
      current: isAlwaysListening,
      voiceRef: !!voiceRef.current,
      initializing: initializingRef.current 
    });
    
    // Prevent concurrent toggles
    if (initializingRef.current) {
      console.log('[Rocker] Already initializing, ignoring toggle');
      return;
    }
    
    const newAlwaysListening = !isAlwaysListening;
    setIsAlwaysListening(newAlwaysListening);
    
    // Stop existing connection
    if (voiceRef.current) {
      console.log('[Rocker] Disconnecting existing voice connection');
      voiceRef.current.disconnect();
      voiceRef.current = null;
      setIsVoiceMode(false);
      setVoiceStatus('disconnected');
      setVoiceTranscript('');
    }
    
    if (newAlwaysListening) {
      initializingRef.current = true;
      try {
        console.log('[Rocker] Creating new voice connection in always listening mode');
        const voice = await createVoiceConnection(true);
        voiceRef.current = voice;
        setIsVoiceMode(true);
        
        toast({
          title: "Wake word activated",
          description: "Say 'Hey Rocker' to start a conversation anywhere on the site",
        });
      } catch (error) {
        console.error('[Rocker] Error starting wake word mode:', error);
        toast({
          title: "Wake word failed",
          description: error instanceof Error ? error.message : 'Failed to start wake word mode',
          variant: "destructive",
        });
        setVoiceStatus('disconnected');
        setIsVoiceMode(false);
        setIsAlwaysListening(false);
      } finally {
        initializingRef.current = false;
      }
    } else {
      toast({
        title: "Wake word deactivated",
        description: "Voice mode turned off",
      });
    }
  }, [isAlwaysListening, createVoiceConnection, toast]);

  // Send message to Rocker
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: RockerMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

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
            mode: 'user'
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

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Add tool execution feedback if present
      if (result.tool_calls && result.tool_calls.length > 0) {
        for (const tc of result.tool_calls) {
          // Execute DOM actions if needed
          if (tc.name === 'click_element' || tc.name === 'fill_field' || tc.name === 'get_page_info') {
            const args = typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments;
            
            let domResult;
            if (tc.name === 'click_element') {
              domResult = executeDOMAction({
                type: 'click',
                targetName: args.element_name
              });
            } else if (tc.name === 'fill_field') {
              domResult = executeDOMAction({
                type: 'fill',
                targetName: args.field_name,
                value: args.value
              });
            } else if (tc.name === 'get_page_info') {
              domResult = executeDOMAction({ type: 'read' });
            }
            
            // Show feedback if result exists
            if (domResult) {
              toast({
                title: domResult.success ? 'Action completed' : 'Action failed',
                description: domResult.message,
                variant: domResult.success ? 'default' : 'destructive',
              });
            }
          }
        }
        
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
        
        // Handle navigation from tool calls
        if (result.navigationPath) {
          handleNavigation(result.navigationPath);
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
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content.length > 0));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, handleNavigation]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Auto-start always listening on mount (persists across pages)
  useEffect(() => {
    console.log('[Rocker] 🚀 Provider mounted', { 
      isAlwaysListening, 
      voiceStatus, 
      isVoiceMode,
      initializing: initializingRef.current 
    });
    
    // Initialize DOM agent
    import('./dom-agent').then(() => {
      console.log('[Rocker] DOM agent initialized');
    });
    
    // Prevent duplicate initialization
    if (initializingRef.current) {
      console.log('[Rocker] Already initializing, skipping');
      return;
    }
    
    if (!isAlwaysListening && voiceStatus === 'disconnected') {
      initializingRef.current = true;
      console.log('[Rocker] 🎤 Starting always listening mode - say "Hey Rocker" to activate');
      toggleAlwaysListening()
        .then(() => {
          console.log('[Rocker] ✓ Always listening active - microphone is ready');
        })
        .catch((error) => {
          console.error('[Rocker] ❌ Failed to start always listening:', error);
        })
        .finally(() => {
          initializingRef.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceRef.current && !isAlwaysListening) {
        voiceRef.current.disconnect();
        voiceRef.current = null;
      }
    };
  }, [isAlwaysListening]);

  const value: RockerContextValue = {
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
  };

  return (
    <RockerContext.Provider value={value}>
      {children}
    </RockerContext.Provider>
  );
}
