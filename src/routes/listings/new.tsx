import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function NewListing() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [sellerEntityId, setSellerEntityId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: myEntities } = useQuery({
    queryKey: ['my-entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('id, display_name')
        .not('owner_user_id', 'is', null)
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerEntityId) {
      toast.error('Please select a seller entity');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('listings' as any)
        .insert({
          seller_entity_id: sellerEntityId,
          title,
          description,
          price_cents: parseInt(priceCents),
          stock_qty: parseInt(stockQty),
          status: 'active'
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast.success('Listing created');
      navigate(`/listings/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="entity">Seller Entity</Label>
                <Select value={sellerEntityId} onValueChange={setSellerEntityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {myEntities?.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (cents)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={priceCents}
                    onChange={(e) => setPriceCents(e.target.value)}
                    required
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Listing'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/listings')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
