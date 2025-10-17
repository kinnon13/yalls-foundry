import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/design/components/Sheet';
import { Button } from '@/design/components/Button';
import { Select } from '@/design/components/Select';
import { Badge } from '@/design/components/Badge';
import { Price } from '@/design/components/Price';
import { getEventClasses, submitEntry } from '@/lib/rodeo/service';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { tokens } from '@/design/tokens';

type EnterNowSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  userId: string;
};

export const EnterNowSheet = ({ isOpen, onClose, eventId, userId }: EnterNowSheetProps) => {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId),
    enabled: !!eventId && isOpen,
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['user-horses', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('entities')
        .select('id, display_name')
        .eq('kind', 'horse')
        .eq('owner_user_id', userId);
      return data || [];
    },
    enabled: !!userId && isOpen,
  });

  const submitMutation = useMutation({
    mutationFn: () => submitEntry(selectedClassId, userId, selectedHorseId || undefined),
    onSuccess: () => {
      toast({ title: 'Entry submitted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['event-entries'] });
      onClose();
      setSelectedClassId('');
      setSelectedHorseId('');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to submit entry', description: error.message, variant: 'destructive' });
    },
  });

  const selectedClass = classes.find((c: any) => c.id === selectedClassId);
  const totalFees = selectedClass
    ? (selectedClass.fees_jsonb.entry_cents || 0) + (selectedClass.fees_jsonb.office_cents || 0)
    : 0;

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Enter Now">
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.m }}>
        <Select
          value={selectedClassId}
          onChange={setSelectedClassId}
          options={classes.map((c: any) => ({ value: c.id, label: c.title }))}
          placeholder="Select Class"
        />

        {selectedClass && (
          <div style={{
            padding: tokens.space.m,
            background: tokens.color.surface[1],
            borderRadius: tokens.radius.m,
          }}>
            <div style={{ marginBottom: tokens.space.s }}>
              <Badge variant="default">{selectedClass.discipline}</Badge>
            </div>
            <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>
              Entry: <Price cents={selectedClass.fees_jsonb.entry_cents || 0} size="sm" />
              {' • '}
              Office: <Price cents={selectedClass.fees_jsonb.office_cents || 0} size="sm" />
            </div>
            <div style={{
              marginTop: tokens.space.s,
              fontSize: tokens.typography.size.m,
              fontWeight: tokens.typography.weight.semibold,
            }}>
              Total: <Price cents={totalFees} />
            </div>
          </div>
        )}

        <Select
          value={selectedHorseId}
          onChange={setSelectedHorseId}
          options={horses.map((h: any) => ({ value: h.id, label: h.display_name }))}
          placeholder="Select Horse (optional)"
        />

        <Button
          variant="primary"
          onClick={() => submitMutation.mutate()}
          disabled={!selectedClassId || submitMutation.isPending}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Entry'}
        </Button>
      </div>
    </Sheet>
  );
};
