import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Program = { id: string; title: string; business_id: string; created_at: string };

export default function IncentivesPanel() {
  const [rows, setRows] = useState<Program[]>([]);
  const [title, setTitle] = useState('');
  const [businessId, setBusinessId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data: progs } = await supabase
        .from('incentive_programs' as any)
        .select('*')
        .order('created_at', { ascending: false });
      setRows((progs || []) as unknown as Program[]);

      // Preselect a business the user belongs to
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: memberships } = await supabase
        .from('business_members' as any)
        .select('business_id')
        .eq('user_id', user?.id);
      setBusinessId((memberships as any)?.[0]?.business_id ?? '');
      setLoading(false);
    })();
  }, []);

  const createProgram = async () => {
    const { error } = await supabase
      .from('incentive_programs' as any)
      .insert({ title, business_id: businessId } as any);
    
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
      description: 'Program created successfully',
    });

    setTitle('');
    const { data: progs } = await supabase
      .from('incentive_programs' as any)
      .select('*')
      .order('created_at', { ascending: false });
    setRows((progs || []) as unknown as Program[]);
  };

  return (
    <section className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incentive Programs</h1>
        <p className="text-muted-foreground">Manage producer incentive programs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Program</CardTitle>
          <p className="text-sm text-muted-foreground">
            Producer members only
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Program title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Business ID"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
          <Button onClick={createProgram} disabled={!title || !businessId}>
            Create Program
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">Title</th>
                  <th className="p-3 text-left text-sm font-medium">Business</th>
                  <th className="p-3 text-left text-sm font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      No programs yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-sm font-medium">{r.title}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {r.business_id.slice(0, 8)}...
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
