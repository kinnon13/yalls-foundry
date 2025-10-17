import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfilePins } from '@/hooks/useProfilePins';
import { PinType } from '@/ports/profilePins';

interface AddPinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function AddPinModal({ open, onOpenChange, userId }: AddPinModalProps) {
  const { add } = useProfilePins(userId);
  const [pinType, setPinType] = useState<PinType>('link');
  const [title, setTitle] = useState('');
  const [refId, setRefId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await add.mutateAsync({
      pin_type: pinType,
      ref_id: refId || crypto.randomUUID(),
      title,
      metadata: {},
    });
    setTitle('');
    setRefId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Pin</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pin-type">Type</Label>
            <Select value={pinType} onValueChange={(v) => setPinType(v as PinType)}>
              <SelectTrigger id="pin-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="horse">Horse</SelectItem>
                <SelectItem value="earning">Earning</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pin-title">Title</Label>
            <Input
              id="pin-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My awesome achievement"
              required
            />
          </div>

          <div>
            <Label htmlFor="pin-ref">Reference ID (optional)</Label>
            <Input
              id="pin-ref"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              placeholder="UUID or URL"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? 'Adding...' : 'Add Pin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
