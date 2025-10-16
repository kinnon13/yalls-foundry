import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Image, Video, X } from 'lucide-react';
import { resolveTenantId } from '@/lib/tenancy/context';
import { useMediaUpload } from '@/hooks/useMediaUpload';

interface CreatePostProps {
  onPostCreated?: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadPostMedia, uploading } = useMediaUpload();

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const preview = URL.createObjectURL(file);
      setMediaPreview(preview);
    }
  };

  const removeMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaFile) {
      toast({
        title: 'Error',
        description: 'Please add content or media',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to post',
          variant: 'destructive',
        });
        return;
      }

      let mediaUrl = null;
      let mediaType = 'text';

      if (mediaFile) {
        const uploadResult = await uploadPostMedia(mediaFile);
        if (!uploadResult) return;
        mediaUrl = uploadResult.file_url;
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
      }

      const tenantId = await resolveTenantId(user.id);
      const { error } = await supabase
        .from('posts')
        .insert({
          body: content || null,
          author_id: user.id,
          kind: mediaType,
          media: mediaUrl ? [{ url: mediaUrl, type: mediaType }] : [],
          tenant_id: tenantId,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your post has been created!',
      });

      setContent('');
      removeMedia();
      onPostCreated?.();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            id="composer"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[100px] resize-none"
            data-rocker="post field"
            aria-label="Post field"
            name="post-content"
            disabled={isSubmitting || uploading}
          />
          
          {mediaPreview && (
            <div className="relative rounded-lg overflow-hidden">
              {mediaFile?.type.startsWith('image/') ? (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-96 object-cover" />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-96" />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || uploading || !!mediaFile}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'video/*';
                    fileInputRef.current.click();
                  }
                }}
                disabled={isSubmitting || uploading || !!mediaFile}
              >
                <Video className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || uploading || (!content.trim() && !mediaFile)}
              data-rocker="post button"
              aria-label="Post button"
            >
              <Send className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
