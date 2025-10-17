/**
 * Business Dashboard - Full Entity & Storefront Management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Store, Users, Settings } from 'lucide-react';

type Entity = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  owner_user_id: string;
  metadata: any;
};

export default function DashboardBusiness() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ['owned-entities'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('entities')
        .select('*')
        .eq('owner_user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Entity[];
    },
  });

  const createEntity = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('entities')
        .insert({
          name: form.name,
          slug: form.slug,
          kind: 'business',
          owner_user_id: user.user?.id,
          metadata: { description: form.description }
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setForm({ name: '', slug: '', description: '' });
      qc.invalidateQueries({ queryKey: ['owned-entities'] });
      toast({ title: 'Business created!' });
    },
    onError: (e) => toast({ title: 'Failed to create', description: String(e), variant: 'destructive' }),
  });

  const { data: stats } = useQuery({
    queryKey: ['business-stats'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const [listings, orders, members] = await Promise.all([
        (supabase as any).from('marketplace_listings').select('id', { count: 'exact', head: true }).eq('seller_entity_id', entities[0]?.id),
        (supabase as any).from('orders').select('id', { count: 'exact', head: true }),
        (supabase as any).from('entity_members').select('id', { count: 'exact', head: true }).eq('entity_id', entities[0]?.id),
      ]);
      return {
        listings: listings.count || 0,
        orders: orders.count || 0,
        members: members.count || 0,
      };
    },
    enabled: entities.length > 0,
  });

  if (isLoading) return <div className="p-6 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Management</h1>
          <p className="text-muted-foreground">Manage your entities, storefronts, and team</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Create Business</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Business</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Business Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="URL Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button className="w-full" disabled={!form.name || createEntity.isPending} onClick={() => createEntity.mutate()}>
                {createEntity.isPending ? 'Creating...' : 'Create Business'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Store className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.listings}</div>
                <div className="text-sm text-muted-foreground">Active Listings</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.members}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.orders}</div>
                <div className="text-sm text-muted-foreground">Total Orders</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map((entity) => (
          <Card key={entity.id} className="p-6">
            <h3 className="text-xl font-bold mb-2">{entity.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">@{entity.slug}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Edit</Button>
              <Button variant="outline" size="sm" className="flex-1">Team</Button>
            </div>
          </Card>
        ))}
      </div>

      {entities.length === 0 && (
        <Card className="p-12 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">No businesses yet</h3>
          <p className="text-muted-foreground mb-4">Create your first business to get started</p>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Business</Button>
        </Card>
      )}
    </div>
  );
}
