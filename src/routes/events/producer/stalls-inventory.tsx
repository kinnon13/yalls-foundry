/**
 * Event Producer: Stalls & RV Inventory
 * Production UI: Mac efficiency + TikTok feel + Amazon capabilities
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { tokens } from '@/design/tokens';

interface Inventory {
  id: string;
  event_id: string;
  kind: 'stall' | 'rv';
  qty_total: number;
  qty_reserved: number;
  price_cents: number;
  metadata: Record<string, any>;
}

export default function StallsInventory() {
  const { eventId } = useParams<{ eventId: string }>();
  const [editingStalls, setEditingStalls] = useState(false);
  const [editingRV, setEditingRV] = useState(false);
  const [stallsData, setStallsData] = useState({ qty: 0, price: 0 });
  const [rvData, setRVData] = useState({ qty: 0, price: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inventory
  const { data: inventory = [] } = useQuery({
    queryKey: ['stalls-inventory', eventId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stalls_rv_inventory')
        .select('*')
        .eq('event_id', eventId);
      
      if (error) throw error;
      return data as Inventory[];
    },
    enabled: !!eventId,
  });

  const stallsItem = inventory.find(i => i.kind === 'stall');
  const rvItem = inventory.find(i => i.kind === 'rv');

  // Upsert inventory
  const upsertInventory = useMutation({
    mutationFn: async (params: { kind: 'stall' | 'rv'; qty: number; price: number }) => {
      const { data, error } = await (supabase as any)
        .from('stalls_rv_inventory')
        .upsert({
          event_id: eventId,
          kind: params.kind,
          qty_total: params.qty,
          price_cents: params.price * 100,
          metadata: {},
        }, { onConflict: 'event_id,kind' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stalls-inventory', eventId] });
      toast({ title: `${variables.kind === 'stall' ? 'Stalls' : 'RV Spots'} updated` });
      if (variables.kind === 'stall') setEditingStalls(false);
      else setEditingRV(false);
    },
  });

  return (
    <div style={{ padding: tokens.space.xl, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold, marginBottom: tokens.space.l }}>
        Stalls & RV Inventory
      </h1>

      {/* Stalls */}
      <Card style={{ padding: tokens.space.l, marginBottom: tokens.space.m }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.m }}>
          <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold }}>
            Stalls
          </h3>
          <Button variant="ghost" size="s" onClick={() => setEditingStalls(!editingStalls)}>
            {editingStalls ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {editingStalls ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.space.m }}>
            <Input
              type="number"
              placeholder="Total quantity"
              value={stallsData.qty.toString()}
              onChange={(val) => setStallsData(prev => ({ ...prev, qty: parseInt(val) || 0 }))}
            />
            <Input
              type="number"
              placeholder="Price ($)"
              value={stallsData.price.toString()}
              onChange={(val) => setStallsData(prev => ({ ...prev, price: parseInt(val) || 0 }))}
            />
            <Button
              variant="primary"
              size="m"
              onClick={() => upsertInventory.mutate({ kind: 'stall', ...stallsData })}
              disabled={!stallsData.qty || upsertInventory.isPending}
            >
              Save
            </Button>
          </div>
        ) : stallsItem ? (
          <div>
            <p>Total: {stallsItem.qty_total}</p>
            <p>Reserved: {stallsItem.qty_reserved}</p>
            <p>Available: {stallsItem.qty_total - stallsItem.qty_reserved}</p>
            <p>Price: ${(stallsItem.price_cents / 100).toFixed(2)}</p>
          </div>
        ) : (
          <p style={{ color: tokens.color.text.secondary }}>No stalls configured</p>
        )}
      </Card>

      {/* RV Spots */}
      <Card style={{ padding: tokens.space.l }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.m }}>
          <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold }}>
            RV Spots
          </h3>
          <Button variant="ghost" size="s" onClick={() => setEditingRV(!editingRV)}>
            {editingRV ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {editingRV ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.space.m }}>
            <Input
              type="number"
              placeholder="Total quantity"
              value={rvData.qty.toString()}
              onChange={(val) => setRVData(prev => ({ ...prev, qty: parseInt(val) || 0 }))}
            />
            <Input
              type="number"
              placeholder="Price ($)"
              value={rvData.price.toString()}
              onChange={(val) => setRVData(prev => ({ ...prev, price: parseInt(val) || 0 }))}
            />
            <Button
              variant="primary"
              size="m"
              onClick={() => upsertInventory.mutate({ kind: 'rv', ...rvData })}
              disabled={!rvData.qty || upsertInventory.isPending}
            >
              Save
            </Button>
          </div>
        ) : rvItem ? (
          <div>
            <p>Total: {rvItem.qty_total}</p>
            <p>Reserved: {rvItem.qty_reserved}</p>
            <p>Available: {rvItem.qty_total - rvItem.qty_reserved}</p>
            <p>Price: ${(rvItem.price_cents / 100).toFixed(2)}</p>
          </div>
        ) : (
          <p style={{ color: tokens.color.text.secondary }}>No RV spots configured</p>
        )}
      </Card>
    </div>
  );
}
