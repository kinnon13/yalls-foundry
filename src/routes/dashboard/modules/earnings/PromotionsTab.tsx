/**
 * Promotions Tab - Create/manage discounts and boosts
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, TrendingDown, Zap } from 'lucide-react';
import { toast } from 'sonner';

type Promotion = {
  id: string;
  name: string;
  kind: 'discount' | 'boost';
  discount_type: 'percent' | 'amount';
  discount_value: number;
  start_at: string;
  end_at: string;
  status: 'draft' | 'active' | 'ended' | 'cancelled';
};

export function PromotionsTab() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', session?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('owner_user_id', session!.userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Promotion[];
    },
    enabled: !!session?.userId,
  });

  const createPromotion = useMutation({
    mutationFn: async (promo: any) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          name: promo.name || 'Untitled',
          kind: promo.kind || 'discount',
          discount_type: promo.discount_type || 'percent',
          discount_value: promo.discount_value || 0,
          start_at: promo.start_at,
          end_at: promo.end_at,
          status: promo.status || 'draft',
          owner_user_id: session!.userId,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion created');
      setShowForm(false);
    },
  });

  const now = new Date().toISOString();
  const active = promotions?.filter(p => p.status === 'active' && p.start_at <= now && p.end_at >= now) || [];
  const upcoming = promotions?.filter(p => p.status === 'active' && p.start_at > now) || [];
  const ended = promotions?.filter(p => p.status === 'ended' || p.end_at < now) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promotions</h2>
          <p className="text-sm text-muted-foreground">Discounts and boosts for your listings</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {showForm && <PromotionForm onSubmit={(data) => createPromotion.mutate(data)} />}

      {/* Active Promotions */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-500" />
          Live Now ({active.length})
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {active.map(promo => <PromotionCard key={promo.id} promotion={promo} />)}
          {active.length === 0 && (
            <Card className="col-span-2">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No active promotions
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Upcoming ({upcoming.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map(promo => <PromotionCard key={promo.id} promotion={promo} />)}
          </div>
        </div>
      )}

      {/* Ended */}
      {ended.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-muted-foreground" />
            Ended ({ended.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {ended.slice(0, 4).map(promo => <PromotionCard key={promo.id} promotion={promo} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function PromotionCard({ promotion }: { promotion: Promotion }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{promotion.name}</CardTitle>
          <Badge variant={promotion.status === 'active' ? 'default' : 'outline'}>
            {promotion.status}
          </Badge>
        </div>
        <CardDescription>
          {promotion.discount_type === 'percent' ? `${promotion.discount_value}% off` : `$${(promotion.discount_value / 100).toFixed(2)} off`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Starts: {new Date(promotion.start_at).toLocaleString()}</div>
          <div>Ends: {new Date(promotion.end_at).toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PromotionForm({ onSubmit }: { onSubmit: (data: Partial<Promotion>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    kind: 'discount' as 'discount' | 'boost',
    discount_type: 'percent' as 'percent' | 'amount',
    discount_value: 10,
    start_at: new Date().toISOString().slice(0, 16),
    end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'active' as const,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Promotion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Flash Sale"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.discount_type} onValueChange={(v: any) => setFormData({ ...formData, discount_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="value">
              {formData.discount_type === 'percent' ? 'Percent Off' : 'Amount Off (cents)'}
            </Label>
            <Input
              id="value"
              type="number"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start">Start Date</Label>
            <Input
              id="start"
              type="datetime-local"
              value={formData.start_at}
              onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">End Date</Label>
          <Input
            id="end"
            type="datetime-local"
            value={formData.end_at}
            onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
          />
        </div>
        <Button onClick={() => onSubmit(formData)} className="w-full">
          Create Promotion
        </Button>
      </CardContent>
    </Card>
  );
}
