/**
 * Memory Share Prompt
 * 
 * Prompts user A to share a memory with user B after safety check
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Share2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MemorySharePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: {
    id: string;
    key: string;
    value: any;
  };
  recipient: {
    id: string;
    name: string;
  };
  moderationResult?: {
    decision: 'ok' | 'soften' | 'block';
    toxicity_score: number;
    safety_category: string;
    softened_content?: string;
    reason?: string;
  };
  onShare: (softenedVersion?: boolean) => Promise<void>;
  onCancel: () => void;
}

export function MemorySharePrompt({
  open,
  onOpenChange,
  memory,
  recipient,
  moderationResult,
  onShare,
  onCancel,
}: MemorySharePromptProps) {
  const [loading, setLoading] = useState(false);
  const [useSoftened, setUseSoftened] = useState(
    moderationResult?.decision === 'soften'
  );

  const handleShare = async () => {
    setLoading(true);
    try {
      await onShare(useSoftened && moderationResult?.decision === 'soften');
      onOpenChange(false);
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  const contentToShow = 
    useSoftened && moderationResult?.softened_content
      ? moderationResult.softened_content
      : typeof memory.value === 'object'
      ? JSON.stringify(memory.value, null, 2)
      : memory.value;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share with {recipient.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You're about to share this memory with {recipient.name}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Safety Check Result */}
          {moderationResult && moderationResult.decision !== 'ok' && (
            <Alert variant={moderationResult.decision === 'block' ? 'destructive' : 'default'}>
              {moderationResult.decision === 'block' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription>
                {moderationResult.decision === 'block' ? (
                  <div>
                    <p className="font-medium">Cannot Share</p>
                    <p className="text-sm mt-1">
                      This content violates our community guidelines ({moderationResult.safety_category}).
                      It won't be saved or shared.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Softened Version Available</p>
                    <p className="text-sm mt-1">
                      I've adjusted the wording to keep it respectful. You can share the original or softened version.
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Content Preview */}
          {moderationResult?.decision !== 'block' && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm font-medium mb-2">{memory.key}</p>
              <p className="text-sm whitespace-pre-wrap">{contentToShow}</p>
            </div>
          )}

          {/* Softened Toggle */}
          {moderationResult?.decision === 'soften' && moderationResult.softened_content && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-softened"
                checked={useSoftened}
                onChange={(e) => setUseSoftened(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="use-softened" className="text-sm cursor-pointer">
                Use softened version (recommended)
              </label>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Don't Share
          </Button>
          {moderationResult?.decision !== 'block' && (
            <Button
              onClick={handleShare}
              disabled={loading}
            >
              {loading ? 'Sharing...' : 'Share'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
