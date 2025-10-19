import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { callEdge } from '@/lib/edge/callEdge';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Printer, ArrowLeft } from 'lucide-react';

type Order = {
  id: string;
  created_at: string;
  status: string;
  buyer_user_id: string;
  seller_entity_id: string;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
  mock_paid_at: string | null;
  label_printed_at: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
};

type OLI = { 
  id: string; 
  listing_id: string | null; 
  title_snapshot: string; 
  qty: number; 
  unit_price_cents: number; 
  metadata: any; 
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OLI[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [me, setMe] = useState<string | null>(null);

  const asUSD = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const load = async () => {
    setLoading(true);
    const q = supabase.from("orders" as any)
      .select("id, created_at, status, buyer_user_id, seller_entity_id, subtotal_cents, tax_cents, shipping_cents, total_cents, mock_paid_at, label_printed_at, reversed_at, reversal_reason")
      .eq("id", id!).maybeSingle();
    
    const [user, ord] = await Promise.all([supabase.auth.getUser(), q]);
    setMe(user.data.user?.id ?? null);
    if (!ord.error && ord.data) setOrder(ord.data as any);

    const olis = await supabase
      .from("order_line_items" as any)
      .select("id, order_id, listing_id, title_snapshot, qty, unit_price_cents, metadata")
      .eq("order_id", id!);
    
    if (!olis.error && olis.data) setItems(olis.data as any);
    setLoading(false);
  };

  useEffect(() => { if (id) load(); }, [id]);

  const canPrintLabel = useMemo(() => {
    if (!order || !me) return false;
    const isSellerSide = order.buyer_user_id !== me;
    return isSellerSide && order.status === "paid" && !order.label_printed_at && !order.reversed_at;
  }, [order, me]);

  const daysUntilReversal = useMemo(() => {
    if (!order || order.status !== 'paid' || order.label_printed_at || order.reversed_at) return null;
    const paidAt = new Date(order.mock_paid_at || order.created_at).getTime();
    const elapsed = Date.now() - paidAt;
    const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysElapsed);
  }, [order]);

  const markLabelPrinted = async () => {
    setPrinting(true);
    try {
      await callEdge("preview-pay-labels", { order_id: order!.id });
      await load();
      toast.success("Label marked printed");
    } catch (e: any) {
      toast.error(e.message || "Couldn't mark label");
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">Loading…</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Order not found.</p>
          <Button variant="outline" onClick={() => navigate("/orders")} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/orders")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Order #{order.id.slice(0,8)}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(order.created_at), 'PPp')}
                </p>
                {order.reversed_at && (
                  <p className="text-sm text-destructive font-semibold mt-2">
                    ⚠️ Reversed: {order.reversal_reason || 'No label printed within 7 days'}
                  </p>
                )}
                {daysUntilReversal !== null && canPrintLabel && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold mt-2">
                    ⚠️ Print label within {daysUntilReversal} day{daysUntilReversal !== 1 ? 's' : ''} or order will be reversed
                  </p>
                )}
              </div>
              <Badge variant={order.status === 'reversed' ? 'destructive' : order.status === 'paid' ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              {order.mock_paid_at && (
                <Badge variant="secondary">
                  Paid {format(new Date(order.mock_paid_at), 'PPp')}
                </Badge>
              )}
              {order.label_printed_at && (
                <Badge variant="secondary">
                  Label printed {format(new Date(order.label_printed_at), 'PPp')}
                </Badge>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {items.map(it => (
                  <div key={it.id} className="flex items-center justify-between rounded border p-3">
                    <div>
                      <div className="font-medium">{it.title_snapshot}</div>
                      <div className="text-sm text-muted-foreground">Qty {it.qty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{asUSD(it.unit_price_cents)}</div>
                      <div className="text-sm text-muted-foreground">
                        Line {asUSD(it.qty * it.unit_price_cents)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{asUSD(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{asUSD(order.tax_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{asUSD(order.shipping_cents)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>{asUSD(order.total_cents)}</span>
              </div>
            </div>

            {canPrintLabel && (
              <Button 
                onClick={markLabelPrinted}
                disabled={printing}
                className="w-full gap-2"
                variant={daysUntilReversal !== null && daysUntilReversal <= 2 ? "destructive" : "default"}
              >
                <Printer className="h-4 w-4" />
                {printing ? "Marking…" : "Mark Label Printed (Required within 7 days)"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
