/**
 * Voice Chat with ElevenLabs Conversational AI
 * 
 * Full duplex voice conversation with Andy using ElevenLabs for voice
 * and Grok for AI reasoning/responses via backend webhook.
 */

import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceChatProps {
  agentId?: string;
}

export function VoiceChat({ agentId }: VoiceChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice conversation connected');
      toast({
        title: 'Connected',
        description: 'Voice chat with Andy is live'
      });
    },
    onDisconnect: () => {
      console.log('Voice conversation disconnected');
      toast({
        title: 'Disconnected',
        description: 'Voice chat ended'
      });
    },
    onMessage: (message) => {
      console.log('Voice message:', message);
    },
    onError: (error) => {
      console.error('Voice error:', error);
      toast({
        title: 'Voice error',
        description: typeof error === 'string' ? error : 'Failed to connect',
        variant: 'destructive'
      });
    }
  });

  const handleStartVoice = async () => {
    setIsConnecting(true);

    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from ElevenLabs for the agent
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId || 'your-agent-id'}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get signed URL from ElevenLabs');
      }

      const data = await response.json();
      const url = data.signed_url;

      setSignedUrl(url);

      // Start conversation with signed URL
      await conversation.startSession({
        signedUrl: url
      });

    } catch (error) {
      console.error('Failed to start voice:', error);
      toast({
        title: 'Voice setup failed',
        description: error instanceof Error ? error.message : 'Failed to start voice chat',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStopVoice = async () => {
    await conversation.endSession();
    setSignedUrl(null);
  };

  const isActive = conversation.status === 'connected';

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {conversation.isSpeaking && (
            <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-full" />
          )}
          <div className={`relative flex items-center justify-center w-20 h-20 rounded-full ${
            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            {isConnecting ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isActive ? (
              <Mic className="h-8 w-8" />
            ) : (
              <MicOff className="h-8 w-8" />
            )}
          </div>
        </div>

        <div className="text-center">
          <h3 className="font-semibold mb-1">Voice Chat with Andy</h3>
          <p className="text-sm text-muted-foreground">
            {isActive
              ? conversation.isSpeaking
                ? 'Andy is speaking...'
                : 'Listening...'
              : 'Start talking to Andy'}
          </p>
        </div>

        <div className="flex gap-2 w-full">
          <Button
            onClick={isActive ? handleStopVoice : handleStartVoice}
            disabled={isConnecting}
            variant={isActive ? 'destructive' : 'default'}
            className="flex-1"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : isActive ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                End Call
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Voice Chat
              </>
            )}
          </Button>
        </div>

        {isActive && (
          <div className="w-full p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">{conversation.status}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
