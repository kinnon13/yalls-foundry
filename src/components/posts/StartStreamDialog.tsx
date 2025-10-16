import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Video } from 'lucide-react';
import { resolveTenantId } from '@/lib/tenancy/context';

interface StartStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStreamStarted?: () => void;
}

export function StartStreamDialog({ open, onOpenChange, onStreamStarted }: StartStreamDialogProps) {
  const [title, setTitle] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      void requestCameraAccess();
    } else {
      stopCamera();
      setCamError(null);
      setTitle('');
    }
  }, [open]);

  const requestCameraAccess = async () => {
    setCamError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not available in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Attempt to play explicitly (Safari/iOS)
        try {
          await videoRef.current.play();
        } catch (e) {
          // Autoplay might require user gesture; will play once user interacts
          console.debug('Video play() deferred until user interaction');
        }
      }
    } catch (error) {
      console.error('Camera access error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error requesting camera';
      setCamError(message);
      toast({
        title: 'Camera access blocked',
        description: 'Click Allow in your browser. If you are in a preview frame, open the app in a new tab.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleStartStream = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your stream',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsStarting(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const tenantId = await resolveTenantId(user.id);

      const { error } = await supabase
        .from('live_streams')
        .insert({
          streamer_id: user.id,
          tenant_id: tenantId,
          title: title.trim(),
          status: 'live',
          viewer_count: 0,
          started_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({ title: 'Stream started!', description: 'You are now live' });

      // Keep the dialog open so users see their camera preview
      onStreamStarted?.();
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: 'Failed to start stream',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Start Live Stream</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col gap-3 items-center justify-center h-full text-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {camError ? 'Camera blocked. Please click Allow or open in a new tab.' : 'Requesting camera & mic access...'}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={requestCameraAccess}>Retry</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(window.location.href, '_blank', 'noopener')}
                  >
                    Open in new tab
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stream-title">Stream Title</Label>
            <Input
              id="stream-title"
              placeholder="What's your stream about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-between items-center">
            <p className="text-xs text-muted-foreground">
              If camera access fails in preview, try Open in new tab.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isStarting}
              >
                Close
              </Button>
              <Button onClick={handleStartStream} disabled={!stream || isStarting}>
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Go Live
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
