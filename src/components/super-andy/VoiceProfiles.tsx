/**
 * Voice Profiles Manager
 * Save voice samples to recognize who's speaking
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mic, Trash2, User, Volume2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth/context';

interface VoiceProfile {
  id: string;
  speaker_name: string;
  confidence_threshold: number;
  created_at: string;
  voice_features: any;
}

export function VoiceProfiles() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

  // Load voice profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['voice-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as VoiceProfile[];
    },
    enabled: !!session?.userId
  });

  // Create profile mutation
  const createProfile = useMutation({
    mutationFn: async ({ name, audioBlob }: { name: string; audioBlob: Blob }) => {
      if (!session?.userId) throw new Error('Not authenticated');

      // Upload audio sample
      const fileName = `voice-samples/${session.userId}/${name}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-samples')
        .getPublicUrl(fileName);

      // Create profile
      const { data, error } = await supabase
        .from('voice_profiles')
        .insert({
          user_id: session.userId,
          speaker_name: name,
          voice_sample_url: urlData.publicUrl,
          voice_features: {}, // Will be analyzed server-side
          confidence_threshold: 0.75
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
      toast.success('Voice profile created');
      setNewSpeakerName('');
      setRecordedAudio(null);
    },
    onError: (error) => {
      toast.error(`Failed to create profile: ${error.message}`);
    }
  });

  // Delete profile mutation
  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('voice_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
      toast.success('Voice profile deleted');
    }
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
      }, 5000);
    } catch (error) {
      toast.error('Microphone access denied');
      console.error(error);
    }
  };

  const saveProfile = () => {
    if (!newSpeakerName.trim() || !recordedAudio) {
      toast.error('Please enter a name and record audio');
      return;
    }

    createProfile.mutate({
      name: newSpeakerName.trim(),
      audioBlob: recordedAudio
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Voice Profiles</h3>
          <p className="text-sm text-muted-foreground">
            Save voice samples so Andy can recognize who's speaking
          </p>
        </div>

        {/* New Profile Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <div>
            <Label htmlFor="speaker-name">Speaker Name</Label>
            <Input
              id="speaker-name"
              placeholder="e.g., John, Sarah, Team Member 1"
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={startRecording}
              disabled={isRecording || !newSpeakerName.trim()}
              className="flex-1"
            >
              <Mic className="h-4 w-4 mr-2" />
              {isRecording ? 'Recording... (5s)' : 'Record Voice Sample'}
            </Button>

            {recordedAudio && (
              <Button
                onClick={saveProfile}
                disabled={createProfile.isPending}
              >
                Save Profile
              </Button>
            )}
          </div>

          {recordedAudio && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="h-4 w-4" />
              <span>Sample recorded</span>
            </div>
          )}
        </div>

        {/* Existing Profiles */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Saved Profiles</h4>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No voice profiles yet. Record your first one above!
            </p>
          ) : (
            profiles.map((profile) => (
              <Card key={profile.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{profile.speaker_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {Math.round(profile.confidence_threshold * 100)}% threshold
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteProfile.mutate(profile.id)}
                      disabled={deleteProfile.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Record a 5-second voice sample for each person</li>
            <li>Andy will analyze voice characteristics (pitch, timbre, pace)</li>
            <li>When you speak, Andy can greet you by name</li>
            <li>More samples = better recognition accuracy</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
