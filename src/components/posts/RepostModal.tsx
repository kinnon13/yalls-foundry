import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRepost } from '@/hooks/useRepost';
import { Repeat2 } from 'lucide-react';

interface RepostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePostId: string;
  sourceContent?: string;
}

export function RepostModal({ open, onOpenChange, sourcePostId, sourceContent }: RepostModalProps) {
  const { create } = useRepost();
  const [caption, setCaption] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ source_post_id: sourcePostId, caption: caption || undefined });
    setCaption('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat2 className="h-5 w-5" />
            Repost
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {sourceContent && (
            <div className="p-4 bg-muted rounded-lg border">
              <p className="text-sm text-muted-foreground line-clamp-3">{sourceContent}</p>
            </div>
          )}

          <div>
            <Label htmlFor="repost-caption">Add a caption (optional)</Label>
            <Textarea
              id="repost-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add your thoughts..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Reposting...' : 'Repost'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
