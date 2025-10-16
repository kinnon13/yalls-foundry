import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Video, VideoOff, Loader2 } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      requestCameraAccess();
    } else {
      stopCamera();
    }
  }, [open]);

  const requestCameraAccess = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to start streaming',
        variant: 'destructive',
      });
      onOpenChange(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
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

      toast({
        title: 'Stream started!',
        description: 'You are now live',
      });

      onStreamStarted?.();
      onOpenChange(false);
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
      <DialogContent className="sm:max-w-[600px]">
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
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isStarting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartStream}
              disabled={!stream || isStarting}
            >
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
      </DialogContent>
    </Dialog>
  );
}
