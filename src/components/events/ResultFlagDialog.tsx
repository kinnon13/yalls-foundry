import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';

interface ResultFlagDialogProps {
  eventId: string;
  entryData: any;
}

export function ResultFlagDialog({ eventId, entryData }: ResultFlagDialogProps) {
  const [open, setOpen] = useState(false);
  const [flagType, setFlagType] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const flagTypes = [
    { value: 'wrong_time', label: 'Incorrect Time' },
    { value: 'wrong_rider', label: 'Wrong Rider Listed' },
    { value: 'wrong_horse', label: 'Wrong Horse Listed' },
    { value: 'penalty_error', label: 'Penalty Error' },
    { value: 'duplicate', label: 'Duplicate Entry' },
    { value: 'other', label: 'Other Issue' },
  ];

  const handleSubmit = async () => {
    if (!flagType || !details.trim()) {
      toast.error('Please select a flag type and provide details');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('result_flags')
        .insert({
          event_id: eventId,
          entry_data: entryData,
          reporter_user_id: user?.id,
          flag_type: flagType,
          details
        });

      if (error) throw error;

      toast.success('Issue reported successfully. The event producer will review it.');
      setOpen(false);
      setFlagType('');
      setDetails('');
    } catch (error: any) {
      console.error('Error submitting flag:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Flag className="mr-2 h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Result Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Issue Type</Label>
            <Select value={flagType} onValueChange={setFlagType}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {flagTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Details</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please describe the issue in detail..."
              rows={5}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
