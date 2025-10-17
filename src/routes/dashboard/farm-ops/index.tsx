import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Horse = {
  id: string;
  name: string;
  owner_entity_id: string;
  created_at: string;
};

export default function FarmOpsPanel() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('farm_horses' as any)
        .select('*')
        .order('created_at', { ascending: false });
      setHorses((data || []) as unknown as Horse[]);
      setLoading(false);
    })();
  }, []);

  const createHorse = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: ents } = await supabase
      .from('entities')
      .select('id')
      .eq('owner_user_id', user?.id)
      .limit(1);

    if (!ents?.[0]) {
      toast({
        title: 'Error',
        description: 'No entity found to attach horse',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('farm_horses' as any)
      .insert({ name, owner_entity_id: ents[0].id } as any);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Horse added successfully',
    });

    setName('');
    const { data } = await supabase
      .from('farm_horses' as any)
      .select('*')
      .order('created_at', { ascending: false });
    setHorses((data || []) as unknown as Horse[]);
  };

  return (
    <section className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Barn Dashboard</h1>
        <p className="text-muted-foreground">Manage horses and care plans</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Horse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Horse name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={createHorse} disabled={!name}>
            Add Horse
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {loading && (
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        )}
        {!loading && horses.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">No horses yet</p>
            </CardContent>
          </Card>
        )}
        {horses.map((h) => (
          <Card key={h.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="font-medium text-lg">{h.name}</div>
              <div className="text-sm text-muted-foreground">
                Added {new Date(h.created_at).toLocaleDateString()}
              </div>
              <a
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                href={`/dashboard?m=farm-ops&horse=${h.id}`}
              >
                Care Plans
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
