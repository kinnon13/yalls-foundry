import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  custom_fields: any;
  business_id: string;
  status: string;
  notes: string;
  created_at: string;
};

export default function CRM() {
  const { session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      toast.error('Failed to load contacts');
      console.error(error);
      return;
    }

    setContacts(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!session?.userId || !name.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('crm_contact_upsert', {
        p_name: name,
        p_email: email || null,
        p_phone: phone || null,
        p_tags: []
      });

      if (error) throw error;

      setName('');
      setEmail('');
      setPhone('');
      await load();
      toast.success('Contact saved!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">CRM Contacts</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={save}
                disabled={!name.trim() || loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save/Upsert
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {contacts.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-6">
              <div className="font-medium text-lg mb-1">{c.name}</div>
              <div className="text-sm text-muted-foreground">
                {c.email || '—'} • {c.phone || '—'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
