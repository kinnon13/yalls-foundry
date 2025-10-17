/**
 * Farm Ops: Horses CRUD
 * Production UI: Mac efficiency + TikTok feel + Amazon capabilities
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash } from 'lucide-react';
import { tokens } from '@/design/tokens';

interface Horse {
  id: string;
  name: string;
  sex: string | null;
  dob: string | null;
  color: string | null;
  breed: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export default function Horses() {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sex: '',
    dob: '',
    color: '',
    breed: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch horses
  const { data: horses = [], isLoading } = useQuery({
    queryKey: ['horses'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('horses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Horse[];
    },
  });

  // Create horse
  const createHorse = useMutation({
    mutationFn: async (horse: typeof formData) => {
      const { data, error } = await (supabase as any)
        .from('horses')
        .insert({
          name: horse.name,
          sex: horse.sex || null,
          dob: horse.dob || null,
          color: horse.color || null,
          breed: horse.breed || null,
          metadata: {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast({ title: 'Horse added successfully' });
      setIsCreating(false);
      setFormData({ name: '', sex: '', dob: '', color: '', breed: '' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add horse', description: (error as Error).message, variant: 'destructive' });
    },
  });

  // Delete horse
  const deleteHorse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('horses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast({ title: 'Horse removed' });
    },
  });

  if (isLoading) {
    return <div style={{ padding: tokens.space.xl }}>Loading horses...</div>;
  }

  return (
    <div style={{ padding: tokens.space.xl, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.l }}>
        <h1 style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold }}>
          Horses
        </h1>
        <Button variant="primary" size="m" onClick={() => setIsCreating(!isCreating)}>
          <Plus size={16} style={{ marginRight: tokens.space.xs }} />
          Add Horse
        </Button>
      </div>

      {isCreating && (
        <Card style={{ padding: tokens.space.l, marginBottom: tokens.space.l }}>
          <h3 style={{ marginBottom: tokens.space.m, fontSize: tokens.typography.size.l }}>New Horse</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.space.m }}>
            <Input
              placeholder="Name *"
              value={formData.name}
              onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
            />
            <Input
              placeholder="Sex (e.g., Mare, Stallion, Gelding)"
              value={formData.sex}
              onChange={(val) => setFormData(prev => ({ ...prev, sex: val }))}
            />
            <Input
              placeholder="Date of Birth (YYYY-MM-DD)"
              value={formData.dob}
              onChange={(val) => setFormData(prev => ({ ...prev, dob: val }))}
            />
            <Input
              placeholder="Color"
              value={formData.color}
              onChange={(val) => setFormData(prev => ({ ...prev, color: val }))}
            />
            <Input
              placeholder="Breed"
              value={formData.breed}
              onChange={(val) => setFormData(prev => ({ ...prev, breed: val }))}
            />
          </div>
          <div style={{ display: 'flex', gap: tokens.space.s, marginTop: tokens.space.m }}>
            <Button
              variant="primary"
              size="m"
              onClick={() => createHorse.mutate(formData)}
              disabled={!formData.name || createHorse.isPending}
            >
              Save
            </Button>
            <Button variant="ghost" size="m" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: tokens.space.m }}>
        {horses.map(horse => (
          <Card key={horse.id} style={{ padding: tokens.space.l }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: tokens.space.m }}>
              <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold }}>
                {horse.name}
              </h3>
              <Button
                variant="ghost"
                size="s"
                onClick={() => deleteHorse.mutate(horse.id)}
              >
                <Trash size={14} />
              </Button>
            </div>
            {horse.sex && <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Sex: {horse.sex}</p>}
            {horse.breed && <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Breed: {horse.breed}</p>}
            {horse.color && <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Color: {horse.color}</p>}
            {horse.dob && <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>DOB: {new Date(horse.dob).toLocaleDateString()}</p>}
          </Card>
        ))}
      </div>

      {horses.length === 0 && !isCreating && (
        <div style={{ textAlign: 'center', padding: tokens.space.xxl, color: tokens.color.text.secondary }}>
          No horses yet. Add your first horse to get started.
        </div>
      )}
    </div>
  );
}
