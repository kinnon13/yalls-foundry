/**
 * Consent Modal - Follow consent with data sharing disclosure
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExternalLink } from 'lucide-react';

interface ConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  businessName: string;
}

export function ConsentModal({ open, onOpenChange, onConfirm, businessName }: ConsentModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Follow {businessName}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              By following, you agree to share your name and contact information with this business.
              They may use this to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Send you updates about their services</li>
              <li>Notify you about events and offerings</li>
              <li>Add you to their contact list</li>
            </ul>
            <p className="text-sm">
              You can unfollow or unsubscribe at any time from your profile settings.
            </p>
            <a
              href="/privacy"
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Learn more about data sharing
              <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Agree & Follow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
