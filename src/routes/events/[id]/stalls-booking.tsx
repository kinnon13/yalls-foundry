/**
 * Stalls & RV Booking Page
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function StallsBookingPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [bookingData, setBookingData] = useState({
    kind: 'stall' as 'stall' | 'rv',
    qty: 1,
    nights_json: '[]',
  });

  const { data: inventory } = useQuery({
    queryKey: ['stalls-inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stalls_rv_inventory' as any)
        .select('*')
        .eq('event_id', id);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: myReservations } = useQuery({
    queryKey: ['my-reservations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stalls_rv_reservations' as any)
        .select('*')
        .eq('event_id', id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      if (error) throw error;
      return data || [];
    }
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('stalls_rv_reservations' as any)
        .insert({
          event_id: id,
          user_id: user.user?.id,
          kind: bookingData.kind,
          qty: bookingData.qty,
          nights_json: JSON.parse(bookingData.nights_json || '[]'),
          status: 'pending',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations', id] });
      toast.success('Reservation created!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleBook = () => {
    bookMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Stalls & RV Reservations</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {inventory?.map((item: any) => (
                <div key={item.id} className="border-b py-4 last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold capitalize">{item.kind}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.qty_total} available
                      </p>
                    </div>
                    <p className="font-bold">
                      ${(item.nightly_cents / 100).toFixed(2)}/night
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Make a Reservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type</Label>
                <select
                  value={bookingData.kind}
                  onChange={(e) => setBookingData({ ...bookingData, kind: e.target.value as any })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="stall">Stall</option>
                  <option value="rv">RV</option>
                </select>
              </div>

              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  value={bookingData.qty}
                  onChange={(e) => setBookingData({ ...bookingData, qty: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="nights">Nights (JSON array of dates)</Label>
                <Input
                  id="nights"
                  value={bookingData.nights_json}
                  onChange={(e) => setBookingData({ ...bookingData, nights_json: e.target.value })}
                  placeholder='["2025-01-15", "2025-01-16"]'
                />
              </div>

              <Button onClick={handleBook} disabled={bookMutation.isPending} className="w-full">
                {bookMutation.isPending ? 'Booking...' : 'Reserve'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>My Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            {myReservations?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No reservations yet</p>
            ) : (
              <div className="space-y-4">
                {myReservations?.map((res: any) => (
                  <div key={res.id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold capitalize">{res.kind}</p>
                        <p className="text-sm text-muted-foreground">Qty: {res.qty}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        res.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        res.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
