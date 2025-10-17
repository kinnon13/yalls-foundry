/**
 * Media Uploader Component
 * Handles image uploads to Supabase storage with preview
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploaderProps {
  bucket: 'listing-media' | 'event-media';
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function MediaUploader({ bucket, value, onChange, maxFiles = 5 }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    if (value.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      try {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    onChange([...value, ...newUrls]);
    setUploading(false);
    if (newUrls.length) toast.success(`Uploaded ${newUrls.length} image(s)`);
  };

  const handleRemove = (url: string) => {
    onChange(value.filter(u => u !== url));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {value.map((url, i) => (
          <div key={i} className="relative aspect-square">
            <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
            <button
              onClick={() => handleRemove(url)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {value.length < maxFiles && (
        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="media-upload"
          />
          <label htmlFor="media-upload">
            <Button disabled={uploading} variant="outline" className="cursor-pointer" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Images'}
              </span>
            </Button>
          </label>
          <p className="text-sm text-muted-foreground mt-2">
            {value.length}/{maxFiles} images • Max 10MB per image
          </p>
        </div>
      )}
    </div>
  );
}
