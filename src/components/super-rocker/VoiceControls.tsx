import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Brain, Moon, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useVoice } from '@/hooks/useVoice';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface VoiceControlsProps {
  threadId: string | null;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onModeChange?: (mode: 'super' | 'normal' | 'quiet') => void;
}

export function VoiceControls({ threadId, onTranscript, onModeChange }: VoiceControlsProps) {
  const { session } = useSession();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [mode, setMode] = useState<'super' | 'normal' | 'quiet'>('super');
  const [snoozedUntil, setSnoozedUntil] = useState<string | null>(null);
  
  // Super Andy voice
  const { listen, stopAll, isSupported } = useVoice({
    role: 'super',
    enabled: isSpeakingEnabled,
  });
  
  const stopSTTRef = useRef<(() => void) | null>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    // Load AI preferences
    const loadPrefs = async () => {
      if (!session?.userId) return;
      
      const { data } = await supabase
        .from('ai_preferences')
        .select('*')
        .eq('user_id', session.userId)
        .maybeSingle();
      
      if (data) {
        setIsSpeakingEnabled(data.voice_enabled ?? true);
        setSnoozedUntil(data.snoozed_until);
        
        if (data.snoozed_until && new Date(data.snoozed_until) > new Date()) {
          setMode('quiet');
        } else if (data.super_mode) {
          setMode('super');
        } else {
          setMode('normal');
        }
      }
    };
    
    loadPrefs();
  }, [session?.userId]);

  const toggleMic = () => {
    if (isListening) {
      stopSTTRef.current?.();
      stopSTTRef.current = null;
      setIsListening(false);
      setLiveTranscript('');
    } else {
      const cleanup = listen(
        (text) => {
          onTranscript?.(text, true);
        },
        (text) => {
          setLiveTranscript(text);
          onTranscript?.(text, false);
        }
      );
      
      if (cleanup) {
        stopSTTRef.current = cleanup;
        setIsListening(true);
      } else {
        toast({
          title: 'Microphone not available',
          description: 'Your browser does not support speech recognition',
          variant: 'destructive'
        });
      }
    }
  };

  const toggleSpeaking = async () => {
    const newValue = !isSpeakingEnabled;
    setIsSpeakingEnabled(newValue);
    
    if (!newValue) {
      stopAll();
    }
    
    if (session?.userId) {
      await supabase
        .from('ai_preferences')
        .upsert({
          user_id: session.userId,
          voice_enabled: newValue
        });
    }
  };

  const changeMode = async (newMode: 'super' | 'normal' | 'quiet') => {
    setMode(newMode);
    onModeChange?.(newMode);
    
    if (!session?.userId) return;

    const updates: any = {};
    
    switch (newMode) {
      case 'super':
        updates.super_mode = true;
        updates.silence_ms = 2500;
        updates.confirm_threshold = 0.55;
        break;
      case 'normal':
        updates.super_mode = true;
        updates.silence_ms = 6000;
        updates.confirm_threshold = 0.7;
        break;
      case 'quiet':
        updates.super_mode = false;
        break;
    }
    
    await supabase
      .from('ai_preferences')
      .upsert({
        user_id: session.userId,
        ...updates
      });
    
    toast({
      title: `Mode: ${newMode}`,
      description: newMode === 'super' 
        ? 'Fast questions, auto-learning' 
        : newMode === 'normal'
        ? 'Slower pace, more confirmation'
        : 'No auto-questions'
    });
  };

  const snooze = async (duration: string, scope: 'thread' | 'global') => {
    if (!session?.userId) return;
    
    try {
      const { data } = await supabase.functions.invoke('andy-snooze', {
        body: {
          user_id: session.userId,
          thread_id: threadId,
          text: duration,
          scope
        }
      });
      
      if (data?.ok) {
        setSnoozedUntil(data.until);
        toast({
          title: '🔕 Snoozed',
          description: data.message
        });
      } else {
        toast({
          title: 'Could not parse time',
          description: data?.error || 'Try "for 1 hour" or "until 5pm"',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Snooze failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const unsnooze = async () => {
    if (!session?.userId) return;
    
    try {
      await supabase.functions.invoke('andy-snooze', {
        body: {
          user_id: session.userId,
          text: 'unmute',
          scope: 'global'
        }
      });
      
      setSnoozedUntil(null);
      toast({
        title: '👋 Andy is back',
        description: 'Questions and voice enabled'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to unsnooze',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const isSnoozed = snoozedUntil && new Date(snoozedUntil) > new Date();

  return (
    <div className="flex items-center gap-2">
      {/* Mode Badge */}
      <Badge variant={mode === 'super' ? 'default' : 'secondary'} className="text-xs">
        {mode === 'super' && <Brain className="h-3 w-3 mr-1" />}
        {mode === 'quiet' && <Moon className="h-3 w-3 mr-1" />}
        {mode}
      </Badge>

      {/* Snooze indicator */}
      {isSnoozed && (
        <Button
          size="sm"
          variant="ghost"
          onClick={unsnooze}
          className="text-xs"
        >
          🔕 until {new Date(snoozedUntil!).toLocaleTimeString()}
        </Button>
      )}

      {/* Speaking toggle */}
      {isSupported && (
        <Button
          size="icon"
          variant={isSpeakingEnabled ? 'default' : 'outline'}
          onClick={toggleSpeaking}
          className="h-8 w-8"
        >
          {isSpeakingEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      )}

      {/* Mic toggle */}
      {isSupported && (
        <div className="relative">
          <Button
            size="icon"
            variant={isListening ? 'destructive' : 'outline'}
            onClick={toggleMic}
            className="h-8 w-8"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          {liveTranscript && (
            <div className="absolute bottom-full mb-2 right-0 bg-popover border rounded-lg p-2 text-xs max-w-xs shadow-lg">
              {liveTranscript}
            </div>
          )}
        </div>
      )}

      {/* Mode & Snooze Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            ⚙️
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Andy Mode</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => changeMode('super')}>
            <Brain className="h-4 w-4 mr-2" />
            Super (Fast & Smart)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeMode('normal')}>
            <Sun className="h-4 w-4 mr-2" />
            Normal (Balanced)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeMode('quiet')}>
            <Moon className="h-4 w-4 mr-2" />
            Quiet (No Auto)
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Snooze</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => snooze('for 30 minutes', 'thread')}>
            30m (this thread)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => snooze('for 1 hour', 'global')}>
            1h (all threads)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => snooze('for 2 hours', 'global')}>
            2h (all threads)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
