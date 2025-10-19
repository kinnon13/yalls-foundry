/**
 * Unfollow Modal - Options for unfollowing with different levels
 */

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { BellOff, UserX, Ban } from 'lucide-react';

interface UnfollowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: 'silent_unsubscribe' | 'unfollow' | 'block') => void;
  businessName: string;
}

export function UnfollowModal({ open, onOpenChange, onAction, businessName }: UnfollowModalProps) {
  const handleAction = (action: 'silent_unsubscribe' | 'unfollow' | 'block') => {
    onAction(action);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Unfollow {businessName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Choose how you'd like to stop following this business:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => handleAction('silent_unsubscribe')}
          >
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">Silent Unsubscribe</div>
              <div className="text-xs text-muted-foreground">
                Stop notifications but stay connected
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => handleAction('unfollow')}
          >
            <UserX className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">Unfollow</div>
              <div className="text-xs text-muted-foreground">
                Remove from your feed and contacts
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3 border-destructive/50 hover:bg-destructive/10"
            onClick={() => handleAction('block')}
          >
            <Ban className="h-5 w-5 text-destructive" />
            <div className="text-left">
              <div className="font-medium text-destructive">Block</div>
              <div className="text-xs text-muted-foreground">
                Prevent all future contact
              </div>
            </div>
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
