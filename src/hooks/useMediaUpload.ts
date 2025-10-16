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

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Simple upload for posts (direct to storage)
  const uploadPostMedia = async (file: File): Promise<{ file_url: string } | null> => {
    try {
      setUploading(true);

      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image or video file',
          variant: 'destructive',
        });
        return null;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 50MB',
          variant: 'destructive',
        });
        return null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to upload media',
          variant: 'destructive',
        });
        return null;
      }

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucket = isImage ? 'post-images' : 'post-videos';

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { file_url: publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload media',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Full upload with AI analysis (via edge function)
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

  return { 
    uploadMedia, 
    uploadPostMedia,
    uploading,
    progress
  };
}
