import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDeleteAccount } from '@/lib/account/useDeleteAccount';
import { Trash2, AlertTriangle, Shield } from 'lucide-react';

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { deleteAccount, isDeleting } = useDeleteAccount();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;

    const result = await deleteAccount();
    
    if (result.success) {
      setIsOpen(false);
      // User will be redirected via auth listener
    }
    // If sole admin error, keep dialog open so user can see message
  };

  const canDelete = confirmText === 'DELETE';

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>This action cannot be undone.</strong> Your account will be permanently deleted.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm">
              <p><strong>What happens immediately:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your profile will be anonymized (PII removed)</li>
                <li>Your claimed horses/entities become <strong>unclaimed</strong></li>
                <li>You'll be removed from all business teams</li>
                <li>You'll be signed out</li>
              </ul>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>What's preserved:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Horse/breeder records remain visible (as unclaimed)</li>
                <li>Businesses you own stay active if other admins exist</li>
                <li>Ledger entries preserved for compliance</li>
              </ul>
            </div>

            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Sole Admin Block:</strong> If you're the sole admin of any business, you MUST transfer admin rights first or the deletion will be blocked.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirm">Type <strong>DELETE</strong> to confirm:</Label>
              <Input
                id="confirm"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

