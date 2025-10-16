/**
 * Voice Post Button
 * 
 * Allows users to create posts via voice commands
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { parseVoiceIntent, isConfirmation, isCancel } from '@/lib/voice/intent';
import { publishVoicePost } from '@/lib/voice/api';
import { Mic, MicOff, Send, X } from 'lucide-react';

interface VoicePostButtonProps {
  onPostCreated?: () => void;
}

export function VoicePostButton({ onPostCreated }: VoicePostButtonProps) {
  const [draft, setDraft] = useState<{ content: string; visibility: 'public' | 'followers' | 'private' } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  const { start, stop, listening, supported } = useSpeech({
    onTranscript: (text, isFinal) => {
      if (!isFinal) return;

      // If confirming, check for confirmation keywords
      if (confirming && draft) {
        if (isConfirmation(text)) {
          handleConfirm();
        } else if (isCancel(text)) {
          handleCancel();
        }
        return;
      }

      // Parse for post intent
      const intent = parseVoiceIntent(text);
      
      if (intent.kind === 'post') {
        setDraft({
          content: intent.content,
          visibility: intent.visibility ?? 'public'
        });
        setConfirming(true);
        stop();
        
        toast({
          title: 'Post ready',
          description: 'Say "post it" to publish or "edit" to cancel',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Speech error',
        description: error,
        variant: 'destructive',
      });
    }
  });

  async function handleConfirm() {
    if (!draft) return;

    try {
      setPosting(true);
      const postId = await publishVoicePost(draft);
      
      toast({
        title: 'Posted! ✅',
        description: 'Your post has been published',
      });

      setDraft(null);
      setConfirming(false);
      onPostCreated?.();
    } catch (error: any) {
      console.error('[Voice] Failed to publish:', error);
      toast({
        title: 'Failed to post',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
  }

  function handleCancel() {
    setDraft(null);
    setConfirming(false);
    toast({
      title: 'Cancelled',
      description: 'Draft discarded',
    });
  }

  function toggleListening() {
    if (listening) {
      stop();
    } else {
      start();
    }
  }

  if (!supported) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={toggleListening}
        variant={listening ? 'destructive' : 'default'}
        size="lg"
        className="gap-2"
        data-rocker="voice post button"
      >
        {listening ? (
          <>
            <MicOff className="h-5 w-5" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            Speak to Post
          </>
        )}
      </Button>

      {listening && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Listening... Say "post: your message" to create a post
            </div>
          </CardContent>
        </Card>
      )}

      {confirming && draft && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Content:</div>
              <p className="text-sm">{draft.content}</p>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Visibility:</div>
              <p className="text-sm capitalize">{draft.visibility}</p>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              onClick={handleConfirm}
              disabled={posting}
              className="gap-2"
              data-rocker="confirm voice post"
            >
              <Send className="h-4 w-4" />
              {posting ? 'Posting...' : 'Post it'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={posting}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Edit
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
