/**
 * CreateButton - Center dock button for photo upload
 */

import { Plus, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function CreateButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in to upload photos',
          variant: 'destructive',
        });
        return;
      }

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      // Create post with image
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          author_user_id: user.id,
          kind: 'image',
          body: '',
          media_urls: [publicUrl],
        });

      if (postError) throw postError;

      toast({
        title: 'Photo uploaded',
        description: 'Your photo has been posted successfully',
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <button
        className="dock-create"
        onClick={handleClick}
        title="Create Post"
        aria-label="Create post with photo"
      >
        <div className="dock-create-inner">
          <Plus className="w-8 h-8" strokeWidth={3} />
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload photo"
      />
    </>
  );
}
