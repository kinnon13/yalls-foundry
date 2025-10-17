import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

type Listing = {
  id: string;
  seller_entity_id: string;
  title: string;
  description: string | null;
  price_cents: number;
  stock_qty: number;
  status: string;
};

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function ListingsIndex() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("listings" as any)
        .select("id,seller_entity_id,title,description,price_cents,stock_qty,status")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setRows((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <div className="mx-auto max-w-4xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Marketplace</h1>
          <Button onClick={() => navigate("/listings/new")}>New Listing</Button>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-6">No active listings yet.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.map((l) => (
              <Card key={l.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{l.title}</span>
                    <span className="text-sm opacity-70">{usd(l.price_cents)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {l.description && (
                    <p className="text-sm opacity-75 line-clamp-2">{l.description}</p>
                  )}
                  <div className="text-sm opacity-70">Stock: {l.stock_qty}</div>
                  <div className="flex gap-2">
                    <AddToCartButton listingId={l.id} />
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/listings/${l.id}/edit`)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
