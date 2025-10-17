/**
 * Producers Panel - Incentive Program Management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trophy, DollarSign } from 'lucide-react';

type Program = {
  id: string;
  business_id: string;
  name: string;
  active: boolean;
  rules: any;
  created_at: string;
};

type Nomination = {
  id: string;
  program_id: string;
  foal_name: string;
  status: string;
  created_at: string;
};

export default function ProducersPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [openProgram, setOpenProgram] = useState(false);
  const [openNomination, setOpenNomination] = useState(false);
  const [programForm, setProgramForm] = useState({ name: '', rules: '' });
  const [nominationForm, setNominationForm] = useState({ programId: '', foalName: '' });

  const { data: programs = [] } = useQuery({
    queryKey: ['incentive-programs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('incentive_programs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Program[];
    },
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ['nominations'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('nominations')
        .select('*')
        .eq('nominated_by', user.user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Nomination[];
    },
  });

  const createProgram = useMutation({
    mutationFn: async () => {
      const { data: entities } = await (supabase as any).from('entities').select('id').eq('kind', 'business').limit(1);
      const { error } = await (supabase as any)
        .from('incentive_programs')
        .insert({
          business_id: entities[0]?.id,
          name: programForm.name,
          rules: JSON.parse(programForm.rules || '{}'),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpenProgram(false);
      setProgramForm({ name: '', rules: '' });
      qc.invalidateQueries({ queryKey: ['incentive-programs'] });
      toast({ title: 'Program created!' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e), variant: 'destructive' }),
  });

  const nominateFoal = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc('nominate_foal', {
        p_program_id: nominationForm.programId,
        p_foal_name: nominationForm.foalName,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setOpenNomination(false);
      setNominationForm({ programId: '', foalName: '' });
      qc.invalidateQueries({ queryKey: ['nominations'] });
      toast({ title: 'Foal nominated!' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e), variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Producer Programs</h1>
          <p className="text-muted-foreground">Manage incentive programs and nominations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openProgram} onOpenChange={setOpenProgram}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Create Program</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Incentive Program</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Program Name" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} />
                <Textarea placeholder='Rules (JSON): {"bonus": 5000}' value={programForm.rules} onChange={(e) => setProgramForm({ ...programForm, rules: e.target.value })} />
                <Button className="w-full" disabled={!programForm.name || createProgram.isPending} onClick={() => createProgram.mutate()}>
                  {createProgram.isPending ? 'Creating...' : 'Create Program'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openNomination} onOpenChange={setOpenNomination}>
            <DialogTrigger asChild>
              <Button variant="outline"><Trophy className="w-4 h-4 mr-2" />Nominate Foal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nominate Foal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <select
                  className="w-full p-2 border rounded"
                  value={nominationForm.programId}
                  onChange={(e) => setNominationForm({ ...nominationForm, programId: e.target.value })}
                >
                  <option value="">Select Program</option>
                  {programs.filter(p => p.active).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Input placeholder="Foal Name" value={nominationForm.foalName} onChange={(e) => setNominationForm({ ...nominationForm, foalName: e.target.value })} />
                <Button className="w-full" disabled={!nominationForm.programId || !nominationForm.foalName || nominateFoal.isPending} onClick={() => nominateFoal.mutate()}>
                  {nominateFoal.isPending ? 'Nominating...' : 'Nominate'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="nominations">My Nominations</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {programs.map(p => (
            <Card key={p.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                  <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </Card>
          ))}
          {programs.length === 0 && <p className="text-center text-muted-foreground py-8">No programs yet</p>}
        </TabsContent>

        <TabsContent value="nominations" className="space-y-4">
          {nominations.map(n => (
            <Card key={n.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{n.foal_name}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
                <Badge>{n.status}</Badge>
              </div>
            </Card>
          ))}
          {nominations.length === 0 && <p className="text-center text-muted-foreground py-8">No nominations yet</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
