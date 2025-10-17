/**
 * Stallions Panel - Stallion Management & Offspring Tracking
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Award } from 'lucide-react';

type Stallion = {
  id: string;
  name: string;
  metadata: any;
  created_at: string;
};

export default function StallionsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', stud_fee: '' });

  const { data: stallions = [] } = useQuery({
    queryKey: ['stallions'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('entities')
        .select('*')
        .eq('kind', 'stallion')
        .eq('owner_user_id', user.user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Stallion[];
    },
  });

  const { data: offspring = [] } = useQuery({
    queryKey: ['offspring'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('nominations')
        .select('*, incentive_programs(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createStallion = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('entities')
        .insert({
          name: form.name,
          kind: 'stallion',
          owner_user_id: user.user?.id,
          metadata: { stud_fee: parseInt(form.stud_fee) || 0 }
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setForm({ name: '', stud_fee: '' });
      qc.invalidateQueries({ queryKey: ['stallions'] });
      toast({ title: 'Stallion added!' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e), variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stallion Management</h1>
          <p className="text-muted-foreground">Manage stallions, nominations, and ads</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Stallion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Stallion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Stallion Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input type="number" placeholder="Stud Fee ($)" value={form.stud_fee} onChange={(e) => setForm({ ...form, stud_fee: e.target.value })} />
              <Button className="w-full" disabled={!form.name || createStallion.isPending} onClick={() => createStallion.mutate()}>
                {createStallion.isPending ? 'Adding...' : 'Add Stallion'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="stallions">
        <TabsList>
          <TabsTrigger value="stallions">My Stallions</TabsTrigger>
          <TabsTrigger value="offspring">Nominated Offspring</TabsTrigger>
        </TabsList>

        <TabsContent value="stallions" className="space-y-4">
          {stallions.map(stallion => (
            <Card key={stallion.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">{stallion.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Stud Fee: ${stallion.metadata?.stud_fee || 0}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Ads</Button>
                </div>
              </div>
            </Card>
          ))}
          {stallions.length === 0 && (
            <Card className="p-12 text-center">
              <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No stallions yet</h3>
              <p className="text-muted-foreground mb-4">Add your first stallion to start managing breeding</p>
              <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Stallion</Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="offspring" className="space-y-4">
          {offspring.map((o: any) => (
            <Card key={o.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{o.foal_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {o.incentive_programs?.name} • {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge>{o.status}</Badge>
              </div>
            </Card>
          ))}
          {offspring.length === 0 && <p className="text-center text-muted-foreground py-8">No nominations yet</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
