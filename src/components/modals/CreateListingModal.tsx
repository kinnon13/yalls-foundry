/**
 * Create Listing Modal
 * 
 * Create/edit marketplace listings with autosave
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
import { Save, Package } from 'lucide-react';
import { CreateContext } from './CreateModalRouter';
import { useDebounced } from '@/hooks/useDebounced';

type ListingPayload = {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
};

type CreateListingModalProps = {
  context: CreateContext;
  onSaved: (draftId: string) => void;
  onPublished: (listingId: string) => void;
  onClose: () => void;
};

export default function CreateListingModal({ context, onSaved, onPublished, onClose }: CreateListingModalProps) {
  const { session } = useSession();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');

  const [payload, setPayload] = useState<ListingPayload>({
    title: '',
    description: '',
    price: 0,
    currency: 'USD',
    category: ''
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
        setPayload(data.payload as ListingPayload);
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
            kind: 'listing',
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
    if (!session?.userId || !payload.title.trim()) {
      toast({
        title: "Cannot publish",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      // Note: Marketplace integration pending - for now just mark draft as published
      // TODO: Wire to actual marketplace table once schema is confirmed
      
      if (currentDraftId) {
        await supabase
          .from('drafts')
          .update({ status: 'published' } as any)
          .eq('id', currentDraftId);
      }

      toast({
        title: "Draft saved!",
        description: "Marketplace listing will be created once marketplace schema is ready"
      });

      // EMIT EVENT: Notify Rocker of listing creation
      try {
        const { rockerEvents } = await import('@/lib/rocker-events');
        await rockerEvents.createListing(session.userId, {
          draft_id: currentDraftId,
          title: payload.title,
          category: payload.category,
          price: payload.price,
        });
      } catch (emitError) {
        console.error('[EventBus] Failed to emit event:', emitError);
      }

      // Return draft ID as temporary entity ID
      onPublished(currentDraftId || crypto.randomUUID());

      return;
    } catch (error) {
      console.error('Error saving listing draft:', error);
      toast({
        title: "Error",
        description: "Failed to save listing draft",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Listing</DialogTitle>
        <DialogDescription>
          List an item in the marketplace
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Item title"
            value={payload.title}
            onChange={(e) => setPayload({ ...payload, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your item..."
            value={payload.description}
            onChange={(e) => setPayload({ ...payload, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={payload.price || ''}
              onChange={(e) => setPayload({ ...payload, price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={payload.currency}
              onChange={(e) => setPayload({ ...payload, currency: e.target.value })}
            />
          </div>
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
            disabled={isPublishing || !payload.title.trim()}
          >
            <Package className="w-4 h-4 mr-2" />
            {isPublishing ? 'Creating...' : 'Create Listing'}
          </Button>
        </div>
      </div>
    </>
  );
}
