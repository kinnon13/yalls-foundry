import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { ShoppingCart } from "lucide-react";
import { getCartSessionId } from "@/lib/cart/session";

const Qty = z.number().int().min(1).max(9999);

export function AddToCartButton({ 
  listingId, 
  variant = {} 
}: { 
  listingId: string; 
  variant?: Record<string, any>; 
}) {
  const [loading, setLoading] = useState(false);

  const add = async (qty = 1) => {
    const parsed = Qty.safeParse(qty);
    if (!parsed.success) {
      toast.error("Invalid quantity");
      return;
    }

    setLoading(true);
    try {
      const sessionId = getCartSessionId();
      const { error } = await supabase.rpc("cart_upsert_item", {
        p_listing_id: listingId,
        p_qty: parsed.data,
        p_variant: variant,
        p_session_id: sessionId,
      });
      if (error) throw error;
      toast.success("Added to cart");
    } catch (e: any) {
      toast.error(e.message || "Couldn't add to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      disabled={loading} 
      onClick={() => add(1)}
      className="gap-2"
    >
      <ShoppingCart className="h-4 w-4" />
      {loading ? "Adding…" : "Add to cart"}
    </Button>
  );
}
