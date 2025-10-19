/**
 * Avatar Uploader Component
 * Allows users to upload their profile photo to Supabase storage
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth/context';

interface AvatarUploaderProps {
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
}

export function AvatarUploader({ currentUrl, onUploadComplete }: AvatarUploaderProps) {
  const { session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Delete old avatar if exists
      if (currentUrl) {
        const oldPath = currentUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new avatar
      const ext = file.name.split('.').pop();
      const fileName = `${session.userId}/avatar.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
      toast.success('Profile photo updated!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onUploadComplete('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Profile photo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
          {previewUrl && (
            <button
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="avatar-upload"
          />
          <label htmlFor="avatar-upload">
            <Button 
              disabled={uploading} 
              variant="outline" 
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG or WEBP • Max 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
