/**
 * Event Entry Page - Entrant Self-Serve
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';

const EntrySchema = z.object({
  class_key: z.string().min(1, 'Class required'),
  rider_entity_id: z.string().uuid('Valid rider required'),
  horse_entity_id: z.string().uuid().optional(),
});

export default function EventEntryPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    class_key: '',
    rider_entity_id: '',
    horse_entity_id: '',
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events' as any)
        .select('*')
        .eq('id', eventId)
        .single();
      if (error) throw error;
      return data as any;
    }
  });

  const { data: classes } = useQuery({
    queryKey: ['event-classes', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_classes' as any)
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;
      return data || [];
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (values: z.infer<typeof EntrySchema>) => {
      const { data, error } = await supabase.rpc('entry_submit', {
        p_event_id: eventId,
        p_class_key: values.class_key,
        p_rider_entity_id: values.rider_entity_id,
        p_horse_entity_id: values.horse_entity_id || null,
      } as any);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', eventId] });
      toast.success('Entry submitted!');
      navigate(`/events/${eventId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit entry');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = EntrySchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'Invalid form data');
      return;
    }
    submitMutation.mutate(result.data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Enter Event: {event?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="class_key">Class</Label>
                <select
                  id="class_key"
                  value={formData.class_key}
                  onChange={(e) => setFormData({ ...formData, class_key: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="">Select a class</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.key} value={cls.key}>
                      {cls.title} - ${(cls.fee_cents / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="rider_entity_id">Rider ID</Label>
                <Input
                  id="rider_entity_id"
                  value={formData.rider_entity_id}
                  onChange={(e) => setFormData({ ...formData, rider_entity_id: e.target.value })}
                  placeholder="UUID of rider entity"
                  required
                />
              </div>

              <div>
                <Label htmlFor="horse_entity_id">Horse ID (optional)</Label>
                <Input
                  id="horse_entity_id"
                  value={formData.horse_entity_id}
                  onChange={(e) => setFormData({ ...formData, horse_entity_id: e.target.value })}
                  placeholder="UUID of horse entity"
                />
              </div>

              <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                {submitMutation.isPending ? 'Submitting...' : 'Submit Entry'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
