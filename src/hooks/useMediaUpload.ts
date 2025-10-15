import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  file: File;
  caption?: string;
  visibility?: 'public' | 'private' | 'team';
  context?: string;
}

interface MediaAnalysis {
  entities?: Array<{
    type: string;
    name: string;
    confidence: number;
  }>;
  scene?: string;
  emotion?: string;
  context?: string;
}

interface MediaRecord {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  caption: string;
  ai_analysis: MediaAnalysis | null;
  created_at: string;
}

export const useMediaUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadMedia = async (options: UploadOptions): Promise<MediaRecord | null> => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', options.file);
      if (options.caption) formData.append('caption', options.caption);
      if (options.visibility) formData.append('visibility', options.visibility);
      if (options.context) formData.append('context', options.context);

      setProgress(30);

      const { data, error } = await supabase.functions.invoke('upload-media', {
        body: formData
      });

      if (error) throw error;

      setProgress(100);

      toast({
        title: 'Upload successful!',
        description: data.message || 'Your file has been uploaded.',
      });

      return data.media;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const linkMediaToEntity = async (
    mediaId: string,
    entityType: 'horse' | 'profile' | 'business' | 'event',
    entityId: string
  ) => {
    try {
      const { error } = await (supabase as any)
        .from('media_entities')
        .insert({
          media_id: mediaId,
          entity_type: entityType,
          entity_id: entityId,
          confidence: 1.0
        });

      if (error) throw error;

      toast({
        title: 'Linked successfully',
        description: 'Media has been linked to the entity.',
      });
    } catch (error) {
      console.error('Link error:', error);
      toast({
        title: 'Link failed',
        description: 'Failed to link media to entity',
        variant: 'destructive',
      });
    }
  };

  const createHorseFeedPost = async (
    horseId: string,
    mediaId: string,
    caption: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('horse_feed')
        .insert({
          horse_id: horseId,
          media_id: mediaId,
          post_type: 'photo',
          caption: caption,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Posted to feed',
        description: 'Your post has been added to the horse feed.',
      });
    } catch (error) {
      console.error('Feed post error:', error);
      toast({
        title: 'Post failed',
        description: 'Failed to create feed post',
        variant: 'destructive',
      });
    }
  };

  const getUserMedia = async (limit = 20) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('media')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as MediaRecord[];
    } catch (error) {
      console.error('Get media error:', error);
      return [];
    }
  };

  return {
    uploading,
    progress,
    uploadMedia,
    linkMediaToEntity,
    createHorseFeedPost,
    getUserMedia,
  };
};
