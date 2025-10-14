/**
 * Business CRM - Contacts (Kanban)
 * 
 * TanStack Query + drag-drop stub for contact management
 */

import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type Contact = {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'lead' | 'customer' | 'vip' | 'inactive';
  created_at: string;
};

export default function BusinessCRMContacts() {
  const { bizId } = useParams<{ bizId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' });

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['crm-contacts', bizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('business_id', bizId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!bizId,
  });

  // Create contact
  const createMutation = useMutation({
    mutationFn: async (contact: { name: string; email: string; phone: string }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert({
          business_id: bizId!,
          name: contact.name,
          email: contact.email || null,
          phone: contact.phone || null,
          status: 'lead',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', bizId] });
      toast({ title: 'Contact added successfully' });
      setDialogOpen(false);
      setNewContact({ name: '', email: '', phone: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add contact', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Group contacts by status (kanban columns)
  const columns = ['lead', 'customer', 'vip', 'inactive'] as const;
  const groupedContacts = columns.map(status => ({
    status,
    contacts: contacts?.filter(c => c.status === status) || [],
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CRM Contacts</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="john@example.com"
                  type="email"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <Button
                onClick={() => createMutation.mutate(newContact)}
                disabled={!newContact.name || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {groupedContacts.map(({ status, contacts }) => (
          <div key={status} className="space-y-2">
            <h2 className="font-semibold capitalize">{status} ({contacts.length})</h2>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">{contact.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                    <p>{contact.email}</p>
                    <p>{contact.phone}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
