/**
 * Cart Nudge Kernel
 * Sends personalized reminders for abandoned carts
 */

interface KernelContext {
  events: {
    recent: (type: string, limit: number) => any[];
  };
  commands: {
    invoke: (app: string, action: string, params: any) => Promise<any>;
  };
}

const NUDGE_DELAY_HOURS = 24;

export async function runCartNudge(ctx: KernelContext) {
  const cartAdds = ctx.events.recent('add_to_cart', 100);
  const checkouts = ctx.events.recent('checkout_complete', 100);
  
  if (!cartAdds.length) {
    return;
  }

  const now = Date.now();
  const cutoff = now - (NUDGE_DELAY_HOURS * 60 * 60 * 1000);
  
  // Find abandoned carts
  const abandonedCarts = cartAdds.filter(add => {
    const addTime = new Date(add.timestamp).getTime();
    const hasCheckout = checkouts.some(c => 
      c.detail?.userId === add.detail?.userId &&
      c.detail?.cartId === add.detail?.cartId
    );
    
    return addTime < cutoff && !hasCheckout;
  });

  // Send personalized nudges
  for (const cart of abandonedCarts) {
    const { userId, cartId, items } = cart.detail || {};
    
    if (!userId || !cartId) continue;
    
    const message = generateNudgeMessage(items);
    
    await ctx.commands.invoke('messages', 'send_message', {
      recipient_id: userId,
      body: message,
      metadata: {
        type: 'cart_nudge',
        cart_id: cartId,
        nudge_count: 1
      }
    });
  }
}

function generateNudgeMessage(items: any[]): string {
  if (!items || !items.length) {
    return "You left something in your cart! Complete your purchase now.";
  }
  
  const itemCount = items.length;
  const firstItem = items[0]?.name || 'item';
  
  if (itemCount === 1) {
    return `Still interested in ${firstItem}? It's waiting in your cart!`;
  }
  
  return `You have ${itemCount} items in your cart including ${firstItem}. Ready to check out?`;
}
