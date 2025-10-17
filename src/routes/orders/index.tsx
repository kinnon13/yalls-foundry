import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

type Order = {
  id: string;
  created_at: string;
  status: string;
  buyer_user_id: string;
  seller_entity_id: string;
  total_cents: number;
  mock_paid_at: string | null;
  label_printed_at: string | null;
};

export default function OrdersIndex() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"purchases" | "sales">("purchases");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders" as any)
        .select("id, created_at, status, buyer_user_id, seller_entity_id, total_cents, mock_paid_at, label_printed_at")
        .order("created_at", { ascending: false });
      if (!error && data) setOrders(data as any);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { 
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); 
  }, []);

  const filtered = useMemo(() => {
    if (!userId) return [];
    return orders.filter(o => 
      view === "purchases" ? o.buyer_user_id === userId : o.buyer_user_id !== userId
    );
  }, [orders, userId, view]);

  const asUSD = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Orders</CardTitle>
              <div className="inline-flex rounded-md border overflow-hidden">
                <Button
                  variant={view === "purchases" ? "default" : "ghost"}
                  onClick={() => setView("purchases")}
                  className="rounded-none"
                  size="sm"
                >
                  Purchases
                </Button>
                <Button
                  variant={view === "sales" ? "default" : "ghost"}
                  onClick={() => setView("sales")}
                  className="rounded-none"
                  size="sm"
                >
                  Sales
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {view} yet.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(o => (
                  <div 
                    key={o.id} 
                    className="flex items-center justify-between rounded border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        #{o.id.slice(0,8)} • {format(new Date(o.created_at), 'PPp')}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{o.status}</Badge>
                        {o.mock_paid_at && <Badge variant="secondary">Paid</Badge>}
                        {o.label_printed_at && <Badge variant="secondary">Label printed</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">{asUSD(o.total_cents)}</div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/orders/${o.id}`)}
                      >
                        View
                      </Button>
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
