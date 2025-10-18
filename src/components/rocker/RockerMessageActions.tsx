import { useState } from 'react';
import { ThumbsDown, Flag, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RockerMessageActionsProps {
  messageIndex: number;
  messageContent: string;
}

export function RockerMessageActions({ messageIndex, messageContent }: RockerMessageActionsProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'incorrect' | 'unhelpful' | 'harmful' | 'other'>('incorrect');
  const [correction, setCorrection] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to submit feedback');
        return;
      }

      // Log as failed interaction
      const { error: logError } = await supabase
        .from('ai_interaction_log')
        .insert({
          user_id: user.id,
          interaction_type: 'chat',
          intent: 'user_correction',
          result_status: 'failed',
          error_message: `${feedbackType}: ${messageContent.substring(0, 100)}`,
          user_correction: correction || null,
          business_context: {
            message_index: messageIndex,
            feedback_type: feedbackType,
            original_response: messageContent
          }
        });

      // Also add to feedback table
      const { error: feedbackError } = await supabase
        .from('ai_feedback')
        .insert({
          user_id: user.id,
          kind: 'negative',
          payload: {
            type: feedbackType,
            message_index: messageIndex,
            original_message: messageContent,
            correction: correction || null,
            timestamp: new Date().toISOString()
          }
        });

      if (feedbackError) {
        throw feedbackError;
      }

      toast.success('Thank you! Your feedback helps Rocker learn.');
      setFeedbackOpen(false);
      setCorrection('');
      setFeedbackType('incorrect');
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setFeedbackOpen(true)}
          title="Report incorrect response"
        >
          <Flag className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Incorrect Response</DialogTitle>
            <DialogDescription>
              Help Rocker learn by marking what was wrong with this response.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Original Message Preview */}
            <div className="p-3 bg-muted/50 rounded-lg border text-sm">
              <p className="text-xs text-muted-foreground mb-1">Rocker said:</p>
              <p className="line-clamp-3">{messageContent}</p>
            </div>

            {/* Feedback Type */}
            <div className="space-y-2">
              <Label>What was wrong?</Label>
              <RadioGroup value={feedbackType} onValueChange={(v: any) => setFeedbackType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="incorrect" id="incorrect" />
                  <Label htmlFor="incorrect" className="font-normal cursor-pointer">
                    Incorrect information or wrong answer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unhelpful" id="unhelpful" />
                  <Label htmlFor="unhelpful" className="font-normal cursor-pointer">
                    Not helpful or irrelevant
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="harmful" id="harmful" />
                  <Label htmlFor="harmful" className="font-normal cursor-pointer">
                    Harmful, offensive, or inappropriate
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">
                    Other issue
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Correction */}
            <div className="space-y-2">
              <Label htmlFor="correction">
                What should Rocker have said? (Optional)
              </Label>
              <Textarea
                id="correction"
                placeholder="Provide the correct information or describe what would have been helpful..."
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFeedbackOpen(false);
                  setCorrection('');
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitFeedback} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
