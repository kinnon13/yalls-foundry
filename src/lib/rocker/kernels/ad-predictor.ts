/**
 * Ad Predictor Kernel
 * Analyzes user behavior to suggest optimal ad placements
 */

interface KernelContext {
  events: {
    recent: (type: string, limit: number) => any[];
  };
  commands: {
    invoke: (app: string, action: string, params: any) => Promise<any>;
  };
}

export async function runAdPredictor(ctx: KernelContext) {
  const reelViews = ctx.events.recent('reel_view', 25);
  const searches = ctx.events.recent('search_query', 10);
  const productViews = ctx.events.recent('product_view', 15);
  
  if (!reelViews.length && !searches.length && !productViews.length) {
    return;
  }

  // Analyze engagement patterns
  const topCategories = extractTopCategories(reelViews, productViews);
  const searchIntent = extractSearchIntent(searches);
  
  const suggestion = {
    slotId: generateSlotId(),
    budget: calculateOptimalBudget(reelViews.length, productViews.length),
    targeting: {
      categories: topCategories,
      keywords: searchIntent,
      engagement_threshold: 0.7
    },
    confidence: calculateConfidence(reelViews, searches, productViews)
  };

  return ctx.commands.invoke('analytics', 'predict_ad_slots', suggestion);
}

function extractTopCategories(reelViews: any[], productViews: any[]): string[] {
  const categories = new Map<string, number>();
  
  [...reelViews, ...productViews].forEach(view => {
    const cat = view.detail?.category || 'general';
    categories.set(cat, (categories.get(cat) || 0) + 1);
  });
  
  return Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
}

function extractSearchIntent(searches: any[]): string[] {
  return searches
    .map(s => s.detail?.query)
    .filter(Boolean)
    .slice(0, 5);
}

function calculateOptimalBudget(reelCount: number, productCount: number): number {
  const baseRate = 100; // cents
  const engagementMultiplier = Math.min(2, (reelCount + productCount) / 20);
  return Math.round(baseRate * engagementMultiplier);
}

function calculateConfidence(reelViews: any[], searches: any[], productViews: any[]): number {
  const total = reelViews.length + searches.length + productViews.length;
  return Math.min(0.95, 0.5 + (total / 100));
}

function generateSlotId(): string {
  return `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
