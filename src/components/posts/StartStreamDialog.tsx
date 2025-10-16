import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Video } from 'lucide-react';
import { resolveTenantId } from '@/lib/tenancy/context';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';

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
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamIdRef = useRef<string | null>(null);
  const { toast } = useToast();
  const { camera, microphone, refresh: refreshPerms } = useMediaPermissions();

  useEffect(() => {
    if (open) {
      void (async () => {
        try {
          await refreshPerms();
        } catch {}
        await requestCameraAccess();
      })();
    } else {
      stopRecordingAndCamera();
      setCamError(null);
      setTitle('');
    }
  }, [open]);

  const requestCameraAccess = async () => {
    setCamError(null);
    try {
      // Check browser permission state to avoid unnecessary prompts
      if (camera === 'denied' || microphone === 'denied') {
        const msg = 'Camera or microphone permission is blocked. Please allow access in your browser settings.';
        setCamError(msg);
        toast({
          title: 'Permissions blocked',
          description: 'Click Allow in your browser, or open in a new tab to grant access.',
          variant: 'destructive',
        });
        return;
      }

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
        try {
          await videoRef.current.play();
        } catch (e) {
          console.debug('Video play() deferred until user interaction');
        }
      }
    } catch (error) {
      console.error('Camera access error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error requesting camera';
      setCamError(message);
      toast({
        title: 'Camera access blocked',
        description: 'Click Allow in your browser. If in preview, open in a new tab.',
        variant: 'destructive',
      });
    }
  };

  const stopRecordingAndCamera = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsRecording(false);
    recordedChunksRef.current = [];
  };

  const startRecording = (streamData: MediaStream, streamId: string) => {
    try {
      const recorder = new MediaRecorder(streamData, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        await uploadRecording(streamId);
      };

      recorder.start(1000); // Collect data every second
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording failed',
        description: 'Could not start video recording',
        variant: 'destructive',
      });
    }
  };

  const uploadRecording = async (streamId: string) => {
    if (recordedChunksRef.current.length === 0) {
      console.log('No recorded chunks to upload');
      return;
    }

    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileName = `${user.id}/${streamId}.webm`;

      const { data, error } = await supabase.storage
        .from('stream-recordings')
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('stream-recordings')
        .getPublicUrl(data.path);

      // Update the live_streams record with the video URL
      await supabase
        .from('live_streams')
        .update({ stream_url: publicUrl })
        .eq('id', streamId);

      console.log('Recording uploaded:', publicUrl);
      toast({
        title: 'Recording saved',
        description: 'Your stream has been saved',
      });
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not save the recording',
        variant: 'destructive',
      });
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

    if (!stream) {
      toast({
        title: 'Camera not ready',
        description: 'Please allow camera access first',
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

      const { data: streamData, error } = await supabase
        .from('live_streams')
        .insert({
          streamer_id: user.id,
          tenant_id: tenantId,
          title: title.trim(),
          status: 'live',
          viewer_count: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      streamIdRef.current = streamData.id;
      startRecording(stream, streamData.id);

      toast({ title: 'Stream started!', description: 'You are now live and recording' });

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
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {isRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-medium">Recording</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-3 items-center justify-center h-full text-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {camError ? 'Camera blocked. Please click Allow or open in a new tab.' : 'Requesting camera & mic access...'}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { void refreshPerms(); void requestCameraAccess(); }}>Retry</Button>
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
              disabled={isRecording}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {isRecording ? 'Recording in progress...' : 'Video will be recorded and saved'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isStarting || isRecording}
              >
                Close
              </Button>
              <Button 
                onClick={handleStartStream} 
                disabled={!stream || isStarting || isRecording}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
