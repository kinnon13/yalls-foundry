/**
 * Farm Ops: Appointments Calendar
 * Production UI: Mac efficiency + TikTok feel + Amazon capabilities
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';
import { tokens } from '@/design/tokens';

interface Appointment {
  id: string;
  horse_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  metadata: Record<string, any>;
}

interface Horse {
  id: string;
  name: string;
}

export default function Appointments() {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    horse_id: '',
    title: '',
    starts_at: '',
    ends_at: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('appointments')
        .select('*')
        .order('starts_at', { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Fetch horses
  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('horses')
        .select('id, name');
      
      if (error) throw error;
      return data as Horse[];
    },
  });

  // Create appointment
  const createAppointment = useMutation({
    mutationFn: async (appt: typeof formData) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('appointments')
        .insert({
          horse_id: appt.horse_id || null,
          title: appt.title,
          starts_at: appt.starts_at,
          ends_at: appt.ends_at,
          created_by: userId,
          metadata: {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Appointment created' });
      setIsCreating(false);
      setFormData({ horse_id: '', title: '', starts_at: '', ends_at: '' });
    },
  });

  return (
    <div style={{ padding: tokens.space.xl, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.l }}>
        <h1 style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold }}>
          <Calendar size={28} style={{ marginRight: tokens.space.s, verticalAlign: 'middle' }} />
          Appointments
        </h1>
        <Button variant="primary" size="m" onClick={() => setIsCreating(!isCreating)}>
          <Plus size={16} style={{ marginRight: tokens.space.xs }} />
          New Appointment
        </Button>
      </div>

      {isCreating && (
        <Card style={{ padding: tokens.space.l, marginBottom: tokens.space.l }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.space.m }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                placeholder="Title (e.g., Vet checkup, Farrier) *"
                value={formData.title}
                onChange={(val) => setFormData(prev => ({ ...prev, title: val }))}
              />
            </div>
            
            <select
              value={formData.horse_id}
              onChange={(e) => setFormData(prev => ({ ...prev, horse_id: e.target.value }))}
              style={{
                padding: tokens.space.s,
                background: tokens.color.bg.light,
                border: `1px solid ${tokens.color.text.secondary}40`,
                borderRadius: tokens.radius.s,
                color: tokens.color.text.primary,
                fontSize: tokens.typography.size.m,
              }}
            >
              <option value="">Select horse (optional)</option>
              {horses.map(horse => (
                <option key={horse.id} value={horse.id}>{horse.name}</option>
              ))}
            </select>

            <div />

            <Input
              placeholder="Start Date/Time"
              value={formData.starts_at}
              onChange={(val) => setFormData(prev => ({ ...prev, starts_at: val }))}
            />
            <Input
              placeholder="End Date/Time"
              value={formData.ends_at}
              onChange={(val) => setFormData(prev => ({ ...prev, ends_at: val }))}
            />
          </div>

          <div style={{ display: 'flex', gap: tokens.space.s, marginTop: tokens.space.m }}>
            <Button
              variant="primary"
              size="m"
              onClick={() => createAppointment.mutate(formData)}
              disabled={!formData.title || !formData.starts_at || !formData.ends_at}
            >
              Create
            </Button>
            <Button variant="ghost" size="m" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gap: tokens.space.s }}>
        {appointments.map(appt => {
          const horse = horses.find(h => h.id === appt.horse_id);
          return (
            <Card key={appt.id} style={{ padding: tokens.space.m, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: tokens.typography.weight.semibold, fontSize: tokens.typography.size.m }}>
                  {appt.title}
                </p>
                {horse && (
                  <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>
                    Horse: {horse.name}
                  </p>
                )}
                <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>
                  {new Date(appt.starts_at).toLocaleString()} - {new Date(appt.ends_at).toLocaleTimeString()}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {appointments.length === 0 && !isCreating && (
        <div style={{ textAlign: 'center', padding: tokens.space.xxl, color: tokens.color.text.secondary }}>
          No appointments scheduled
        </div>
      )}
    </div>
  );
}
