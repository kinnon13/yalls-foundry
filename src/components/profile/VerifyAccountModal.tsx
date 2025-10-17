import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLinkedAccounts } from '@/hooks/useLinkedAccounts';
import { SocialProvider } from '@/ports/linkedAccounts';

interface VerifyAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function VerifyAccountModal({ open, onOpenChange, userId }: VerifyAccountModalProps) {
  const { upsert } = useLinkedAccounts(userId);
  const [provider, setProvider] = useState<SocialProvider>('twitter');
  const [handle, setHandle] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsert.mutateAsync({ provider, handle, proof_url: proofUrl || undefined });
    setHandle('');
    setProofUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Social Account</DialogTitle>
          <DialogDescription>
            Connect your social media accounts to verify your identity
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="provider">Platform</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as SocialProvider)}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="handle">Username/Handle</Label>
            <Input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your_username"
              required
            />
          </div>

          <div>
            <Label htmlFor="proof-url">Proof URL (optional)</Label>
            <Input
              id="proof-url"
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link to a post or bio mentioning this platform for verification
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? 'Linking...' : 'Link Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
