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
import { Mic } from 'lucide-react';
import { useRockerNotifications } from '@/hooks/useRockerNotifications';

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
  
  // Google Drive service
  const googleDriveService = useRef(new GoogleDriveService());
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  
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
  const handleVoiceCommand = useCallback((cmd: { 
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
      const clickResult = executeDOMAction({
        type: 'click',
        targetName: cmd.element_name
      });
      toast({
        title: clickResult.success ? '✅ Clicked' : '❌ Click failed',
        description: clickResult.message,
        variant: clickResult.success ? 'default' : 'destructive',
      });
    }
    else if (cmd.type === 'fill_field' && cmd.field_name && cmd.value) {
      console.log('[Rocker Context] Processing fill command:', cmd.field_name);
      const fillResult = executeDOMAction({
        type: 'fill',
        targetName: cmd.field_name,
        value: cmd.value
      });
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
      setTimeout(() => {
        const result = executeDOMAction({
          type: 'fill',
          targetName: 'post',
          value: cmd.content!
        });
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
          description: "Say 'Hey Rocker' to start a conversation anywhere on the site",
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
      
      // Execute tool calls
      if (result.tool_calls && result.tool_calls.length > 0) {
        console.log('[Rocker] Processing tool calls:', result.tool_calls);
        
        for (const tc of result.tool_calls) {
          const args = typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments;
          console.log('[Rocker] Tool call:', tc.name, args);
          
          // Handle navigation
          if (tc.name === 'navigate') {
            console.log('[Rocker] Navigation tool called:', args.path);
            handleNavigation(args.path);
            toast({
              title: '🧭 Navigating',
              description: `Opening ${args.path}`,
            });
          }
          
          // Handle DOM actions
          else if (tc.name === 'click_element') {
            const clickResult = executeDOMAction({
              type: 'click',
              targetName: args.element_name
            });
            console.log('[Rocker] Click result:', clickResult);
            toast({
              title: clickResult.success ? '✅ Clicked' : '❌ Click failed',
              description: clickResult.message,
              variant: clickResult.success ? 'default' : 'destructive',
            });
          }
          
          else if (tc.name === 'fill_field') {
            const fillResult = executeDOMAction({
              type: 'fill',
              targetName: args.field_name,
              value: args.value
            });
            console.log('[Rocker] Fill result:', fillResult);
            toast({
              title: fillResult.success ? '✍️ Filled field' : '❌ Fill failed',
              description: fillResult.message,
              variant: fillResult.success ? 'default' : 'destructive',
            });
          }
          
          else if (tc.name === 'get_page_info') {
            const domResult = executeDOMAction({ type: 'read' });
            console.log('[Rocker] Page info:', domResult);
          }
          
          else if (tc.name === 'create_post') {
            console.log('[Rocker] Post created via tool');
            toast({
              title: '📝 Posted!',
              description: 'Your post has been created successfully',
            });
          }
          
          else if (tc.name === 'scroll_page') {
            const direction = args.direction || 'down';
            const amount = args.amount === 'little' ? 100 : args.amount === 'screen' ? window.innerHeight : window.innerHeight * 0.8;
            
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
          
          else if (tc.name === 'create_horse') {
            const horseName = args.name;
            console.log('[Rocker] Creating horse via chat tool:', horseName);
            toast({
              title: '🐴 Creating horse...',
              description: `Adding ${horseName} to your horses`,
            });
          }
          
          else if (tc.name === 'create_business') {
            console.log('[Rocker] Creating business:', args.name);
            toast({
              title: '🏢 Business created',
              description: `${args.name} has been registered`,
            });
          }
          
          else if (tc.name === 'create_listing') {
            console.log('[Rocker] Creating marketplace listing:', args.title);
            toast({
              title: '🛒 Listing created',
              description: `${args.title} is now available`,
            });
          }
          
          else if (tc.name === 'add_to_cart') {
            console.log('[Rocker] Adding to cart:', args.listing_id);
            toast({
              title: '🛍️ Added to cart',
              description: 'Item added successfully',
            });
          }
          
          else if (tc.name === 'upload_file') {
            console.log('[Rocker] File upload requested');
            // Trigger file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,application/pdf,.csv,.txt,.doc,.docx';
            input.onchange = async (e: Event) => {
              const target = e.target as HTMLInputElement;
              const file = target.files?.[0];
              if (file) {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('type', file.type);
                  formData.append('userId', session?.user?.id || 'anonymous');

                  const { data, error } = await supabase.functions.invoke('rocker-process-file', {
                    body: formData,
                  });

                  if (error) throw error;

                  toast({
                    title: '📎 File Processed',
                    description: `${file.name} uploaded successfully`,
                  });

                  // Add to messages
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.content,
                    timestamp: new Date()
                  }]);
                } catch (error) {
                  console.error('File upload error:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to process file',
                    variant: 'destructive',
                  });
                }
              }
            };
            input.click();
          }
          else if (tc.name === 'fetch_url') {
            console.log('[Rocker] Fetching URL:', args.url);
            
            try {
              const { data, error } = await supabase.functions.invoke('rocker-fetch-url', {
                body: { url: args.url },
              });

              if (error) throw error;

              toast({
                title: '🌐 URL Fetched',
                description: `Analyzed content from ${args.url}`,
              });

              // Add to messages
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.summary,
                timestamp: new Date()
              }]);
            } catch (error) {
              console.error('URL fetch error:', error);
              toast({
                title: 'Error',
                description: 'Failed to fetch URL content',
                variant: 'destructive',
              });
            }
          }
          else if (tc.name === 'connect_google_drive') {
            console.log('[Rocker] Connecting to Google Drive');
            try {
              const authUrl = await googleDriveService.current.connect();
              window.open(authUrl, '_blank', 'width=600,height=700');
              toast({
                title: '☁️ Opening Google Drive',
                description: 'Please authorize access in the new window',
              });
            } catch (error) {
              console.error('Google Drive connection error:', error);
              toast({
                title: 'Error',
                description: 'Failed to connect to Google Drive',
                variant: 'destructive',
              });
            }
          }
          else if (tc.name === 'list_google_drive_files') {
            console.log('[Rocker] Listing Google Drive files');
            try {
              if (!googleDriveService.current.isConnected()) {
                toast({
                  title: 'Not Connected',
                  description: 'Please connect to Google Drive first',
                  variant: 'destructive',
                });
              } else {
                const files = await googleDriveService.current.listFiles(args.query);
                const fileList = files.map(f => `- ${f.name} (${f.mimeType})`).join('\n');
                
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: `Found ${files.length} files:\n${fileList}`,
                  timestamp: new Date()
                }]);
                
                toast({
                  title: '📁 Files Listed',
                  description: `Found ${files.length} files`,
                });
              }
            } catch (error) {
              console.error('Google Drive list error:', error);
              toast({
                title: 'Error',
                description: 'Failed to list Google Drive files',
                variant: 'destructive',
              });
            }
          }
          else if (tc.name === 'download_google_drive_file') {
            console.log('[Rocker] Downloading Google Drive file:', args.fileName);
            try {
              if (!googleDriveService.current.isConnected()) {
                toast({
                  title: 'Not Connected',
                  description: 'Please connect to Google Drive first',
                  variant: 'destructive',
                });
              } else {
                toast({
                  title: '⏬ Downloading',
                  description: `Downloading ${args.fileName}...`,
                });
                
                const fileUrl = await googleDriveService.current.downloadFile(args.fileId, args.fileName);
                
                // Now process the downloaded file
                const { data, error } = await supabase.functions.invoke('rocker-process-file', {
                  body: { fileUrl, fileName: args.fileName }
                });
                
                if (error) throw error;
                
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: data.content,
                  timestamp: new Date()
                }]);
                
                toast({
                  title: '✅ File Processed',
                  description: `${args.fileName} analyzed successfully`,
                });
              }
            } catch (error) {
              console.error('Google Drive download error:', error);
              toast({
                title: 'Error',
                description: 'Failed to download or process file',
                variant: 'destructive',
              });
            }
          }
          else if (tc.name === 'create_crm_contact') {
            console.log('[Rocker] Creating CRM contact:', args.name);
            toast({
              title: '👤 Contact added',
              description: `${args.name} added to CRM`,
            });
          }
          
          else if (tc.name === 'edit_profile') {
            console.log('[Rocker] Editing profile');
            toast({
              title: '✏️ Profile updated',
              description: 'Changes saved successfully',
            });
          }
          
          else if (tc.name === 'claim_entity') {
            console.log('[Rocker] Claiming entity:', args.entity_type);
            toast({
              title: '🏆 Entity claimed',
              description: `You now own this ${args.entity_type}`,
            });
          }
          
          else if (tc.name === 'search') {
            console.log('[Rocker] Searching:', args.query);
            handleNavigation(`/search?q=${encodeURIComponent(args.query)}${args.type ? `&type=${args.type}` : ''}`);
            toast({
              title: '🔍 Searching',
              description: `Looking for ${args.query}`,
            });
          }
          
          else if (tc.name === 'save_post') {
            console.log('[Rocker] Saving post:', args.post_id);
            toast({
              title: '💾 Post saved',
              description: 'Added to your saved posts',
            });
          }
          
          else if (tc.name === 'create_calendar') {
            console.log('[Rocker] Creating calendar:', args.name);
            toast({
              title: '📅 Calendar created',
              description: `${args.name} is ready to use`,
            });
          }
          
          else if (tc.name === 'create_calendar_event') {
            console.log('[Rocker] Creating calendar event:', args.title);
            
            try {
              // Get user session
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Not authenticated');
              
              // Get or create personal calendar if no calendar_id
              let targetCalendarId = args.calendar_id;
              if (!targetCalendarId) {
                const { data: existingCalendar } = await (supabase as any)
                  .from('calendars')
                  .select('id')
                  .eq('owner_profile_id', user.id)
                  .eq('calendar_type', 'personal')
                  .single();
                
                if (existingCalendar) {
                  targetCalendarId = existingCalendar.id;
                } else {
                  const { data: newCalendar } = await supabase.functions.invoke('calendar-ops', {
                    body: {
                      action: 'create_calendar',
                      owner_profile_id: user.id,
                      name: 'My Calendar',
                      calendar_type: 'personal',
                    },
                  });
                  targetCalendarId = newCalendar?.calendar?.id;
                }
              }
              
              // Create the event
              const { data, error } = await supabase.functions.invoke('calendar-ops', {
                body: {
                  action: 'create_event',
                  calendar_id: targetCalendarId,
                  created_by: user.id,
                  title: args.title,
                  description: args.description,
                  location: args.location,
                  starts_at: args.starts_at,
                  ends_at: args.ends_at || args.starts_at,
                  all_day: args.all_day,
                  visibility: args.visibility || 'private',
                  event_type: args.event_type || 'meeting',
                  reminder_minutes: args.reminder_minutes ?? 0,
                },
              });
              
              if (error) throw error;
              
              // Calculate timing for notification
              const eventTime = new Date(args.starts_at);
              const now = new Date();
              const minutesUntil = Math.round((eventTime.getTime() - now.getTime()) / 60000);
              
              toast({
                title: '📆 Event created',
                description: minutesUntil > 0 
                  ? `"${args.title}" scheduled for ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''} from now`
                  : `Added "${args.title}" to your calendar`,
              });
              
              // If this is a near-future event/notification, schedule reminder processing
              if (minutesUntil <= 5 && minutesUntil >= 0) {
                console.log(`[Rocker] Scheduling reminder to fire in ${minutesUntil} minutes`);
                setTimeout(() => {
                  console.log('[Rocker] Triggering reminder processor');
                  supabase.functions.invoke('process-calendar-reminders');
                }, Math.max(0, minutesUntil * 60 * 1000));
              }
            } catch (error) {
              console.error('[Rocker] Failed to create calendar event:', error);
              toast({
                title: '❌ Failed to create event',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
              });
            }
          }
          
          else if (tc.name === 'share_calendar') {
            console.log('[Rocker] Sharing calendar');
            toast({
              title: '🤝 Calendar shared',
              description: 'Permissions granted successfully',
            });
          }
          
          else if (tc.name === 'create_calendar_collection') {
            console.log('[Rocker] Creating collection:', args.name);
            toast({
              title: '📚 Collection created',
              description: `${args.name} master calendar ready`,
            });
          }
          
          else if (tc.name === 'list_calendars') {
            console.log('[Rocker] Listing calendars');
          }
          
          else if (tc.name === 'get_calendar_events') {
            console.log('[Rocker] Getting calendar events');
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
        
        setMessages(prev => [...prev, assistantMessage]);

        // Play TTS for Rocker's response if voice is authorized
        const voiceAuthorized = localStorage.getItem('rocker-voice-authorized');
        if (voiceAuthorized === 'true' && result.content) {
          try {
            const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
              body: { 
                text: result.content,
                voice: 'alloy'
              }
            });

            if (!ttsError && ttsData?.audioContent) {
              const audio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
              await audio.play().catch(err => {
                console.error('Audio playback failed:', err);
                // Ignore playback errors (e.g., user interaction required)
              });
            }
          } catch (ttsErr) {
            console.error('Error with TTS:', ttsErr);
            // Don't throw - TTS is optional, continue with text response
          }
        }
      } else if (!result.tool_calls || result.tool_calls.length === 0) {
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
      
      {/* Microphone activation banner */}
      {voiceStatus === 'disconnected' && !initializingRef.current && !isAlwaysListening && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-primary/20 rounded-lg shadow-lg p-4 max-w-md flex items-center gap-3 z-50 animate-in slide-in-from-bottom">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Activate voice mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click to enable "Hey Rocker" wake word
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
                  description: "Say 'Hey Rocker' to start a conversation",
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
        </div>
      )}
    </RockerContext.Provider>
  );
}
