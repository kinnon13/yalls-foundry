/**
 * Composer Modal
 * 
 * Create/edit posts with autosave to drafts
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { useToast } from '@/hooks/use-toast';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Send } from 'lucide-react';
import { CreateContext } from './CreateModalRouter';
import { useDebounced } from '@/hooks/useDebounced';

type PostPayload = {
  text: string;
  media: string[];
  mentions: string[];
  tags: string[];
  visibility: 'public' | 'followers' | 'private';
};

type ComposerModalProps = {
  context: CreateContext;
  onSaved: (draftId: string) => void;
  onPublished: (postId: string) => void;
  onClose: () => void;
};

export default function ComposerModal({ context, onSaved, onPublished, onClose }: ComposerModalProps) {
  const { session } = useSession();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');

  const [payload, setPayload] = useState<PostPayload>({
    text: '',
    media: [],
    mentions: [],
    tags: [],
    visibility: 'public'
  });
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSave, setLastSave] = useState<number>(Date.now());

  const debouncedText = useDebounced(payload.text, 3000);

  // Offline queue for resilience
  useEffect(() => {
    if (payload.text && currentDraftId) {
      localStorage.setItem(`draft_${currentDraftId}`, JSON.stringify(payload));
    }
  }, [payload, currentDraftId]);

  // Max interval autosave (15s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastSave > 15000 && payload.text && session?.userId) {
        saveDraft();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [lastSave, payload.text, session?.userId]);

  // Load draft if resuming
  useEffect(() => {
    if (draftId && session?.userId) {
      loadDraft(draftId);
    }
  }, [draftId, session?.userId]);

  // Autosave on debounced text change
  useEffect(() => {
    if (debouncedText && session?.userId) {
      saveDraft();
    }
  }, [debouncedText]);

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
        setPayload(data.payload as PostPayload);
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
        // Update existing
        const { error } = await supabase
          .from('drafts')
          .update({ payload, updated_at: new Date().toISOString() })
          .eq('id', currentDraftId);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('drafts')
          .insert({
            user_id: session.userId,
            profile_id: profileId,
            kind: 'post',
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
      setLastSave(Date.now());
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!session?.userId || !payload.text.trim()) {
      toast({
        title: "Cannot publish",
        description: "Post cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      // Call existing post service
      const { data, error } = await supabase.rpc('rpc_create_post', {
        p_idempotency_key: crypto.randomUUID(),
        p_content: payload.text,
        p_visibility: payload.visibility,
        p_media_urls: payload.media
      });

      if (error) throw error;

      // Mark draft as published if we have one
      if (currentDraftId) {
        await supabase
          .from('drafts')
          .update({ status: 'published' })
          .eq('id', currentDraftId);
      }

      toast({
        title: "Posted!",
        description: "Your post was published successfully"
      });

      onPublished(data);
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: "Failed to publish post",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Post</DialogTitle>
        <DialogDescription>
          {context.source === 'feed' ? 'Share with your feed' : 'Share on profile'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <Textarea
          placeholder="What's on your mind?"
          value={payload.text}
          onChange={(e) => setPayload({ ...payload, text: e.target.value })}
          rows={6}
          className="resize-none"
        />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {isSaving ? 'Saving...' : currentDraftId ? 'Draft saved' : ''}
          </span>
          <span>{payload.text.length} characters</span>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={saveDraft}
            disabled={isSaving || !payload.text.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !payload.text.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>
    </>
  );
}
