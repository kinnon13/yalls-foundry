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
import { toast as sonnerToast } from 'sonner';
import type { RockerMessage } from '@/hooks/useRocker';
import { executeDOMAction } from './dom-agent';
import { GoogleDriveService } from './integrations/google-drive';
import { Button } from '@/components/ui/button';
import { Mic, X } from 'lucide-react';
import { useRockerNotifications } from '@/hooks/useRockerNotifications';
import { AI_PROFILES, type AIRole } from './config';
import { useComposerAwareness } from '@/hooks/useComposerAwareness';

export interface RockerContextValue {
  // Chat state
  messages: RockerMessage[];
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
  voiceStatus: 'connecting' | 'connected' | 'disconnected';
  voiceTranscript: string;
  toggleVoiceMode: () => Promise<void>;
  toggleAlwaysListening: () => Promise<void>;
  
  // UI state
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  
  // Composer awareness
  composerState: {
    isTyping: boolean;
    lastSource?: string;
    lastLength?: number;
    lastSuggestion?: string;
    isLoadingSuggestion: boolean;
    shouldPauseRocker: () => boolean;
  };
}

const RockerContext = createContext<RockerContextValue | null>(null);

export function useRockerGlobal() {
  const context = useContext(RockerContext);
  if (!context) {
    throw new Error('useRockerGlobal must be used within RockerProvider');
  }
  return context;
}

// Alias
export const useRockerChat = useRockerGlobal;

export function RockerProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Chat state
  const [messages, setMessages] = useState<RockerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Mode control
  const [actorRole, setActorRole] = useState<AIRole>('user');
  
  // Voice state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isAlwaysListening, setIsAlwaysListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceBannerDismissed, setVoiceBannerDismissed] = useState(false);
  const voiceRef = useRef<RealtimeVoice | null>(null);
  const initializingRef = useRef(false);
  
  // Google Drive service
  const googleDriveService = useRef(new GoogleDriveService());
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  
  // Composer awareness - make Rocker aware when user is typing
  const composerAwareness = useComposerAwareness();
  
  // Get current user for notifications
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);
  
  // Listen for voice reminders
  useRockerNotifications(currentUserId);

  // Handle navigation from voice or chat
  const handleNavigation = useCallback((path: string) => {
    console.log('[Rocker Navigation] Attempting to navigate to:', path);
    
    if (path === 'back') {
      console.log('[Rocker Navigation] Going back');
      navigate(-1);
      toast({ title: 'Navigating back' });
    } else {
      console.log('[Rocker Navigation] Navigating to:', path);
      navigate(path, { replace: false });
      
      // LEARN: Store successful navigation
      if (currentUserId) {
        supabase.from('ai_feedback').insert({
          user_id: currentUserId,
          kind: 'dom_success',
          payload: { action: 'navigate', target: path, timestamp: new Date().toISOString() }
        });
      }
      
      toast({ 
        title: 'Navigation',
        description: `Opening ${path}`,
      });
    }
  }, [navigate, toast]);

  // Voice command handler
  const handleVoiceCommand = useCallback(async (cmd: { 
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
  }) => {
    console.log('[Rocker Context] Voice command received:', cmd);
    
    if (cmd.type === 'navigate' && cmd.path) {
      console.log('[Rocker Context] Processing navigation command:', cmd.path);
      setTimeout(() => {
        handleNavigation(cmd.path!);
        toast({
          title: '🧭 Navigating',
          description: `Opening ${cmd.path}`,
        });
      }, 100);
    } 
    else if (cmd.type === 'click_element' && cmd.element_name) {
      console.log('[Rocker Context] Processing click command:', cmd.element_name);
      const clickResult = await executeDOMAction({
        type: 'click',
        targetName: cmd.element_name
      }, currentUserId);
      toast({
        title: clickResult.success ? '✅ Clicked' : '❌ Click failed',
        description: clickResult.message,
        variant: clickResult.success ? 'default' : 'destructive',
      });
    }
    else if (cmd.type === 'fill_field' && cmd.field_name && cmd.value) {
      console.log('[Rocker Context] Processing fill command:', cmd.field_name);
      const fillResult = await executeDOMAction({
        type: 'fill',
        targetName: cmd.field_name,
        value: cmd.value
      }, currentUserId);
      toast({
        title: fillResult.success ? '✍️ Filled field' : '❌ Fill failed',
        description: fillResult.message,
        variant: fillResult.success ? 'default' : 'destructive',
      });
    }
    else if (cmd.type === 'create_post' && cmd.content) {
      console.log('[Rocker Context] Processing create post command');
      // For voice, we fill the post field instead of direct DB insert
      handleNavigation('/');
      setTimeout(async () => {
        const result = await executeDOMAction({
          type: 'fill',
          targetName: 'post',
          value: cmd.content!
        }, currentUserId);
        if (result.success) {
          toast({
            title: '📝 Post ready',
            description: 'Your post is filled in. Say "click post button" to submit!',
          });
        } else {
          toast({
            title: '❌ Failed',
            description: 'Could not find post field',
            variant: 'destructive',
          });
        }
      }, 500);
    }
    else if (cmd.type === 'scroll_page') {
      console.log('[Rocker Context] Processing scroll command:', cmd.direction);
      const direction = cmd.direction || 'down';
      const amount = cmd.amount === 'little' ? 100 : cmd.amount === 'screen' ? window.innerHeight : window.innerHeight * 0.8;
      
      if (direction === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (direction === 'bottom') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      } else if (direction === 'up') {
        window.scrollBy({ top: -amount, behavior: 'smooth' });
      } else {
        window.scrollBy({ top: amount, behavior: 'smooth' });
      }
      
      toast({
        title: '📜 Scrolled',
        description: `Scrolling ${direction}`,
      });
    }
    else if (cmd.type === 'create_horse') {
      console.log('[Rocker Context] Processing create horse command:', cmd.name);
      
      const slug = cmd.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const customFields: Record<string, any> = {};
      if (cmd.breed) customFields.breed = cmd.breed;
      if (cmd.color) customFields.color = cmd.color;

      // Use sonner toast.promise for better UX
      sonnerToast.promise(
        (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('entity_profiles')
            .insert({
              entity_type: 'horse',
              name: cmd.name!,
              slug,
              description: cmd.description || `A horse named ${cmd.name}`,
              owner_id: user.id,
              custom_fields: customFields,
              is_claimed: false
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        })(),
        {
          loading: `Creating horse ${cmd.name}...`,
          success: (data) => {
            setTimeout(() => {
              navigate(`/horses/${data.id}`);
            }, 1000);
            return `🐴 Created ${cmd.name}!`;
          },
          error: 'Failed to create horse'
        }
      );
    }
  }, [handleNavigation, navigate, toast]);

  // Initialize voice with navigation handler
  const createVoiceConnection = useCallback(async (alwaysListening: boolean) => {
    setVoiceStatus('connecting');
    
    const { data, error } = await supabase.functions.invoke('rocker-voice-session', {
      body: { alwaysListening }
    });
    
    if (error) throw error;
    if (!data.client_secret?.value) throw new Error('No ephemeral token received');

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
        // Check if mic permission is already granted
        console.log('[Rocker] Checking microphone permission for voice mode');
        let permissionGranted = false;
        
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          permissionGranted = permissionStatus.state === 'granted';
          console.log('[Rocker] Permission status:', permissionStatus.state);
        } catch (e) {
          console.log('[Rocker] Permissions API not supported');
        }
        
        // Only request permission if not already granted
        if (!permissionGranted) {
          console.log('[Rocker] Requesting microphone permission for voice mode');
          try {
            const testStream = await navigator.mediaDevices.getUserMedia({
              audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            for (const t of testStream.getTracks()) t.stop();
            console.log('[Rocker] Microphone permission granted for voice mode');
          } catch (permErr) {
            console.error('[Rocker] Microphone permission denied:', permErr);
            toast({
              title: 'Microphone blocked',
              description: 'Please allow microphone access in your browser',
              variant: 'destructive',
            });
            return;
          }
        } else {
          console.log('[Rocker] Microphone already authorized for voice mode');
        }
        
        const voice = await createVoiceConnection(isAlwaysListening);
        voiceRef.current = voice;
        setIsVoiceMode(true);
        
        toast({
          title: "Voice mode active",
          description: isAlwaysListening
            ? `Say 'Hey ${AI_PROFILES[actorRole || 'user'].name}' to get my attention`
            : `Start speaking to ${AI_PROFILES[actorRole || 'user'].name}!`,
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
        // Check if mic permission is already granted
        console.log('[Rocker] Checking microphone permission status');
        let permissionGranted = false;
        
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          permissionGranted = permissionStatus.state === 'granted';
          console.log('[Rocker] Permission status:', permissionStatus.state);
        } catch (e) {
          console.log('[Rocker] Permissions API not supported, will request directly');
        }
        
        // Only request permission if not already granted
        if (!permissionGranted) {
          console.log('[Rocker] Requesting microphone permission');
          try {
            const testStream = await navigator.mediaDevices.getUserMedia({
              audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            // Immediately stop the test stream; this is just to unlock mic access
            for (const t of testStream.getTracks()) t.stop();
            console.log('[Rocker] Microphone permission granted');
          } catch (permErr) {
            console.error('[Rocker] Microphone permission denied or failed:', permErr);
            toast({
              title: 'Microphone blocked',
              description: 'Please allow microphone access in your browser and try again.',
              variant: 'destructive',
            });
            setVoiceStatus('disconnected');
            setIsVoiceMode(false);
            setIsAlwaysListening(false);
            return;
          }
        } else {
          console.log('[Rocker] Microphone already authorized, skipping permission request');
        }

        console.log('[Rocker] Creating new voice connection in always listening mode');
        const voice = await createVoiceConnection(true);
        voiceRef.current = voice;
        setIsVoiceMode(true);
        
        toast({
          title: 'Wake word activated',
          description: `Say 'Hey ${AI_PROFILES[actorRole || 'user'].name}' to start a conversation anywhere on the site`,
        });
      } catch (error) {
        console.error('[Rocker] Error starting wake word mode:', error);
        toast({
          title: 'Wake word failed',
          description: error instanceof Error ? error.message : 'Failed to start wake word mode',
          variant: 'destructive',
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

  // Expose voice active status globally for other modules to avoid double TTS
  useEffect(() => {
    const active = voiceStatus === 'connected';
    try { localStorage.setItem('rocker-voice-active', active ? 'true' : 'false'); } catch {}
    (window as any).__rockerVoiceActive = active;
  }, [voiceStatus]);

  // Load an existing conversation into UI
  const loadConversation = useCallback(async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Implement knowledge hierarchy:
      // - user: sees only user conversations
      // - admin: sees user + admin conversations
      // - knower: sees ALL conversations
      let query = supabase
        .from('rocker_conversations')
        .select('role, content, created_at, actor_role')
        .eq('user_id', user.id)
        .eq('session_id', sessionId);

      if (actorRole === 'user') {
        query = query.eq('actor_role', 'user');
      } else if (actorRole === 'admin') {
        query = query.in('actor_role', ['user', 'admin']);
      }
      // For 'knower', don't filter by actor_role - see everything

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      const loaded = (data || []).map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at)
      })) as RockerMessage[];

      setMessages(loaded);
      setError(null);
    } catch (err) {
      console.error('[Rocker] Failed to load conversation', err);
      setError('Failed to load conversation');
    }
  }, [actorRole]);

  const createNewConversation = useCallback(async (): Promise<string | undefined> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newId = crypto.randomUUID();
      const { error } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          session_id: newId,
          title: 'New chat',
          summary: null
        });

      if (error) throw error;

      setMessages([]);
      setIsOpen(true);
      return newId;
    } catch (err) {
      console.error('[Rocker] Failed to create conversation', err);
      toast({
        title: 'Could not start new chat',
        description: 'Please try again.',
        variant: 'destructive'
      });
      return undefined;
    }
  }, [setIsOpen, toast]);

  // Send message to Rocker
  const sendMessage = useCallback(async (content: string, sessionId?: string) => {
    if (!content.trim()) return {};
    
    // Prevent duplicate sends
    if (isLoading) {
      console.log('[Rocker] Already processing a message, ignoring duplicate send');
      return {};
    }

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rocker-chat-simple`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            message: content.trim(),
            thread_id: sessionId
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
        const errText = await response.text();
        throw new Error(errText || `Request failed: ${response.statusText}`);
      }

      // Handle JSON response (non-streaming from rocker-chat-simple)
      const result = await response.json();
      
      if (!result.reply) {
        throw new Error(result.error || 'No response from AI');
      }

      // Add assistant message
      const assistantMessage: RockerMessage = {
        role: 'assistant',
        content: result.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Tools are now executed in the backend via rocker-chat-simple
      // No client-side tool execution needed
      
      return { sessionId };

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request cancelled');
      } else {
        setError(err.message || 'Failed to send message');
        console.error('Rocker error:', err);
      }
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content.length > 0));
      return {};
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
    console.log('[Rocker] Initializing...');
    
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
      console.log('[Rocker] Starting always listening mode');
      toggleAlwaysListening().finally(() => {
        initializingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: enable on first user interaction (browser autoplay/mic policies)
  useEffect(() => {
    if (isAlwaysListening || voiceStatus !== 'disconnected') return;
    const handler = () => {
      if (!isAlwaysListening && voiceStatus === 'disconnected' && !initializingRef.current) {
        initializingRef.current = true;
        toggleAlwaysListening().finally(() => { initializingRef.current = false; });
      }
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [isAlwaysListening, voiceStatus, toggleAlwaysListening]);

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
    loadConversation,
    createNewConversation,
    actorRole,
    setActorRole,
    isVoiceMode,
    isAlwaysListening,
    voiceStatus,
    voiceTranscript,
    toggleVoiceMode,
    toggleAlwaysListening,
    isOpen,
    setIsOpen,
    composerState: {
      isTyping: composerAwareness.isTyping,
      lastSource: composerAwareness.lastSource,
      lastLength: composerAwareness.lastLength,
      lastSuggestion: composerAwareness.lastSuggestion,
      isLoadingSuggestion: composerAwareness.isLoadingSuggestion,
      shouldPauseRocker: composerAwareness.shouldPauseRocker,
    },
  };

  return (
    <RockerContext.Provider value={value}>
      {children}
      
      {/* Microphone activation banner - disabled per user request */}
      {false && voiceStatus === 'disconnected' && !initializingRef.current && !isAlwaysListening && !voiceBannerDismissed && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-primary/20 rounded-lg shadow-lg p-4 max-w-md flex items-center gap-3 z-50 animate-in slide-in-from-bottom">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Activate voice mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click to enable "Hey {AI_PROFILES[actorRole || 'user'].name}" wake word
            </p>
          </div>
          <Button 
            variant="default" 
            size="sm"
            className="shrink-0"
            onClick={async () => {
              console.log('[Rocker] User clicked activate - triggering permission request');
              try {
                await toggleAlwaysListening();
                toast({
                  title: "Voice activated!",
                  description: `Say 'Hey ${AI_PROFILES[actorRole || 'user'].name}' to start a conversation`,
                });
              } catch (error: any) {
                console.error('[Rocker] Activation failed:', error);
                if (error?.name === 'NotAllowedError') {
                  toast({
                    title: "Microphone blocked",
                    description: "Please allow microphone access in your browser settings",
                    variant: "destructive",
                  });
                } else {
                  toast({
                    title: "Activation failed",
                    description: error?.message || "Please try again",
                    variant: "destructive",
                  });
                }
              }
            }}
          >
            Activate
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => setVoiceBannerDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </RockerContext.Provider>
  );
}

// Export alias for backwards compatibility
export { RockerProvider as RockerChatProvider };
