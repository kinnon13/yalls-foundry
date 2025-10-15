/**
 * Flag Content Dialog
 * 
 * Allows users to flag unsafe or rule-violating content
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Flag } from 'lucide-react';

interface FlagContentDialogProps {
  contentType: 'listing' | 'user' | 'review' | 'comment';
  contentId: string;
  trigger?: React.ReactNode;
}

export function FlagContentDialog({ contentType, contentId, trigger }: FlagContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase.rpc as any)('flag_content', {
        p_content_type: contentType,
        p_content_id: contentId,
        p_reason: reason,
        p_details: details || null,
      });

      if (error) throw error;

      toast({
        title: 'Content Flagged',
        description: 'Thank you for helping keep our community safe. We\'ll review this report.',
      });

      setReason('');
      setDetails('');
      setOpen(false);
    } catch (error: any) {
      console.error('Error flagging content:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit flag. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Flag className="h-4 w-4" />
            Flag
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us keep the marketplace safe by reporting unsafe or rule-violating content.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dangerous">Dangerous Product/Service</SelectItem>
                <SelectItem value="unsafe">Safety Concern</SelectItem>
                <SelectItem value="scam">Scam or Fraud</SelectItem>
                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="other">Other Violation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional information that would help us review this report..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !reason} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
