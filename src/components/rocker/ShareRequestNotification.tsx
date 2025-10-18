/**
 * Share Request Notification
 * 
 * Shows user B a notification that user A wants to share a memory
 */

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Eye, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ShareRequest {
  id: string;
  from_profile_id: string;
  memory_id: string;
  created_at: string;
  memory?: {
    key: string;
    value: any;
    type: string;
  };
  from_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface ShareRequestNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ShareRequest;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
}

export function ShareRequestNotification({
  open,
  onOpenChange,
  request,
  onAccept,
  onDecline,
}: ShareRequestNotificationProps) {
  const [loading, setLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(request.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await onDecline(request.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  const fromName = request.from_profile?.display_name || 'Someone';
  const timeAgo = formatDistanceToNow(new Date(request.created_at), { addSuffix: true });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Shared Memory from {fromName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {fromName} shared a memory about you {timeAgo}. 
            Would you like to see it?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {request.memory && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {request.memory.type}
                  </Badge>
                  <span className="text-sm font-medium">{request.memory.key}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContent(!showContent)}
                  className="text-xs"
                >
                  {showContent ? (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </>
                  )}
                </Button>
              </div>

              {showContent && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">
                    {typeof request.memory.value === 'object'
                      ? JSON.stringify(request.memory.value, null, 2)
                      : request.memory.value}
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            If you accept, this memory will be saved to your "Shared with me" section. 
            You can remove it anytime.
          </p>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={loading}
          >
            No thanks
          </Button>
          <Button
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? 'Accepting...' : 'Yes, show me'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
