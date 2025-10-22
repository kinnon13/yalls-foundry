/**
 * User Rocker Voice Controls
 * Push-to-talk + action dispatcher
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { listen } from '@/rocker/runtime';
import { invokeAction, type AppAction } from '@/apps/actions';
import { toast } from 'sonner';

export function VoiceControls() {
  const [stop, setStop] = useState<null | (() => void)>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const handleAction = (e: Event) => {
      const { action } = (e as CustomEvent).detail as { action: AppAction };
      invokeAction(action).catch((err) => {
        console.error('[Rocker] Action failed:', err);
        toast.error('Action failed: ' + err.message);
      });
    };

    window.addEventListener('rocker:action', handleAction as any);
    return () => window.removeEventListener('rocker:action', handleAction as any);
  }, []);

  const toggleMic = () => {
    if (stop) {
      stop();
      setStop(null);
      setListening(false);
      return;
    }

    try {
      const stopper = listen((text) => {
        console.log('[Rocker] Voice input:', text);
        toast.info(`Heard: "${text}"`);
        // Send to Andy or parse simple commands
        window.dispatchEvent(
          new CustomEvent('rocker:voice', { detail: { text } })
        );
        // Auto-stop after receiving input
        stopper();
        setStop(null);
        setListening(false);
      });
      setStop(() => stopper);
      setListening(true);
      toast.info('Listening... Speak now');
    } catch (e) {
      toast.error((e as Error).message || 'Microphone not supported');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        data-testid="rocker-ptt"
        onClick={toggleMic}
        variant={listening ? 'default' : 'outline'}
        aria-pressed={listening}
      >
        {listening ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
        {listening ? 'Stop' : 'Push-to-Talk'}
      </Button>
      
      <Button
        variant="outline"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent('rocker:action', {
              detail: { action: { kind: 'open-app', app: 'yallbrary' } },
            })
          );
        }}
      >
        Open Yallbrary
      </Button>
    </div>
  );
}
