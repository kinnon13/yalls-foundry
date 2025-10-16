/**
 * Create Event Modal
 * 
 * Create/edit events with autosave
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { useToast } from '@/hooks/use-toast';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Calendar } from 'lucide-react';
import { CreateContext } from './CreateModalRouter';
import { useDebounced } from '@/hooks/useDebounced';

type EventPayload = {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  visibility: 'public' | 'followers' | 'private';
  location?: { name: string };
};

type CreateEventModalProps = {
  context: CreateContext;
  onSaved: (draftId: string) => void;
  onPublished: (eventId: string) => void;
  onClose: () => void;
};

export default function CreateEventModal({ context, onSaved, onPublished, onClose }: CreateEventModalProps) {
  const { session } = useSession();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');

  const [payload, setPayload] = useState<EventPayload>({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    visibility: 'public'
  });
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const debouncedPayload = useDebounced(payload, 3000);

  useEffect(() => {
    if (draftId && session?.userId) {
      loadDraft(draftId);
    }
  }, [draftId, session?.userId]);

  useEffect(() => {
    if (debouncedPayload.title && session?.userId) {
      saveDraft();
    }
  }, [debouncedPayload]);

  const loadDraft = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', id)
        .eq('user_id', session!.userId)
        .single();

      if (error) throw error;
      if (data) {
        setPayload(data.payload as EventPayload);
        setCurrentDraftId(data.id);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    if (!session?.userId || isSaving) return;
    
    setIsSaving(true);
    try {
      const profileId = context.source.startsWith('profile:') 
        ? context.source.replace('profile:', '')
        : null;

      if (currentDraftId) {
        const { error } = await supabase
          .from('drafts')
          .update({ payload, updated_at: new Date().toISOString() })
          .eq('id', currentDraftId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('drafts')
          .insert({
            user_id: session.userId,
            profile_id: profileId,
            kind: 'event',
            status: 'draft',
            payload
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentDraftId(data.id);
          onSaved(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!session?.userId || !payload.title.trim() || !payload.start_at) {
      toast({
        title: "Cannot publish",
        description: "Title and start time are required",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      const profileId = context.source.startsWith('profile:') 
        ? context.source.replace('profile:', '')
        : session.userId;

      // Use direct query to bypass type checking until types regenerate
      const { data, error } = await supabase
        .from('events')
        .insert([{
          host_profile_id: profileId,
          title: payload.title,
          description: payload.description,
          start_at: payload.start_at,
          end_at: payload.end_at || payload.start_at,
          visibility: payload.visibility,
          location: payload.location
        } as any])
        .select()
        .single();

      if (error) throw error;

      if (currentDraftId) {
        await supabase
          .from('drafts')
          .update({ status: 'published' } as any)
          .eq('id', currentDraftId);
      }

      toast({
        title: "Event created!",
        description: "Your event is now live"
      });

      onPublished(data.id);
    } catch (error) {
      console.error('Error publishing event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Event</DialogTitle>
        <DialogDescription>
          Schedule a new event
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            placeholder="Event name"
            value={payload.title}
            onChange={(e) => setPayload({ ...payload, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What's this event about?"
            value={payload.description}
            onChange={(e) => setPayload({ ...payload, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start">Start Date/Time</Label>
            <Input
              id="start"
              type="datetime-local"
              value={payload.start_at}
              onChange={(e) => setPayload({ ...payload, start_at: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End Date/Time</Label>
            <Input
              id="end"
              type="datetime-local"
              value={payload.end_at}
              onChange={(e) => setPayload({ ...payload, end_at: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select
            value={payload.visibility}
            onValueChange={(value) => setPayload({ ...payload, visibility: value as any })}
          >
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="followers">Followers Only</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {isSaving ? 'Saving...' : currentDraftId ? 'Draft saved' : ''}
          </span>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={saveDraft}
            disabled={isSaving || !payload.title.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !payload.title.trim() || !payload.start_at}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {isPublishing ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </div>
    </>
  );
}
