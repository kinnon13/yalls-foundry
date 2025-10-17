/**
 * Farm Ops: Care Plans & Assignments
 * Production UI: Mac efficiency + TikTok feel + Amazon capabilities
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Check } from 'lucide-react';
import { tokens } from '@/design/tokens';

interface CarePlan {
  id: string;
  name: string;
  description: string | null;
  template: boolean;
  items: any[];
  created_at: string;
}

interface Horse {
  id: string;
  name: string;
}

export default function CarePlans() {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedHorse, setSelectedHorse] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch care plans
  const { data: plans = [] } = useQuery({
    queryKey: ['care_plans'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('care_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CarePlan[];
    },
  });

  // Fetch horses for assignment
  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('horses')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Horse[];
    },
  });

  // Create care plan
  const createPlan = useMutation({
    mutationFn: async (plan: typeof formData) => {
      const { data, error } = await (supabase as any)
        .from('care_plans')
        .insert({
          name: plan.name,
          description: plan.description || null,
          template: true,
          items: [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care_plans'] });
      toast({ title: 'Care plan created' });
      setIsCreating(false);
      setFormData({ name: '', description: '' });
    },
  });

  // Assign care plan to horse
  const assignPlan = useMutation({
    mutationFn: async (params: { planId: string; horseId: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('care_plan_assignments')
        .insert({
          care_plan_id: params.planId,
          horse_id: params.horseId,
          applied_by: userId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Care plan assigned to horse' });
      setSelectedHorse('');
    },
  });

  return (
    <div style={{ padding: tokens.space.xl, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.l }}>
        <h1 style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold }}>
          Care Plans
        </h1>
        <Button variant="primary" size="m" onClick={() => setIsCreating(!isCreating)}>
          <Plus size={16} style={{ marginRight: tokens.space.xs }} />
          New Plan
        </Button>
      </div>

      {isCreating && (
        <Card style={{ padding: tokens.space.l, marginBottom: tokens.space.l }}>
          <div style={{ marginBottom: tokens.space.m }}>
            <Input
              placeholder="Plan Name *"
              value={formData.name}
              onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
            />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            style={{
              width: '100%',
              minHeight: 80,
              padding: tokens.space.m,
              background: tokens.color.bg.light,
              border: `1px solid ${tokens.color.text.secondary}40`,
              borderRadius: tokens.radius.s,
              color: tokens.color.text.primary,
              fontSize: tokens.typography.size.m,
              marginBottom: tokens.space.m,
            }}
          />
          <div style={{ display: 'flex', gap: tokens.space.s }}>
            <Button variant="primary" size="m" onClick={() => createPlan.mutate(formData)} disabled={!formData.name}>
              Save
            </Button>
            <Button variant="ghost" size="m" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: tokens.space.m }}>
        {plans.map(plan => (
          <Card key={plan.id} style={{ padding: tokens.space.l }}>
            <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.s }}>
              {plan.name}
            </h3>
            {plan.description && (
              <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary, marginBottom: tokens.space.m }}>
                {plan.description}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: tokens.space.s, alignItems: 'center', marginTop: tokens.space.m }}>
              <select
                value={selectedHorse}
                onChange={(e) => setSelectedHorse(e.target.value)}
                style={{
                  flex: 1,
                  padding: tokens.space.s,
                  background: tokens.color.bg.light,
                  border: `1px solid ${tokens.color.text.secondary}40`,
                  borderRadius: tokens.radius.s,
                  color: tokens.color.text.primary,
                  fontSize: tokens.typography.size.m,
                }}
              >
                <option value="">Assign to horse...</option>
                {horses.map(horse => (
                  <option key={horse.id} value={horse.id}>
                    {horse.name}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="s"
                onClick={() => assignPlan.mutate({ planId: plan.id, horseId: selectedHorse })}
                disabled={!selectedHorse || assignPlan.isPending}
              >
                <Check size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {plans.length === 0 && !isCreating && (
        <div style={{ textAlign: 'center', padding: tokens.space.xxl, color: tokens.color.text.secondary }}>
          No care plans yet. Create templates for feeding, training, and vet schedules.
        </div>
      )}
    </div>
  );
}
