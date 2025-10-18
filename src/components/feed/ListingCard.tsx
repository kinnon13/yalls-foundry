/**
 * ListingCard - Shop item with swipe media, price, Add to Cart
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import type { ListingFeedItem } from '@/types/feed';

interface ListingCardProps {
  listing: ListingFeedItem;
}

export function ListingCard({ listing }: ListingCardProps) {
  const hasMedia = listing.media && listing.media.length > 0;
  const priceFormatted = (listing.price_cents / 100).toFixed(2);

  return (
    <Card className="overflow-hidden shadow-md rounded-2xl aspect-square flex flex-col">
      {/* Media */}
      {hasMedia && (
        <div className="relative flex-1 bg-muted">
          <img
            src={listing.media[0].url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          {listing.stock_quantity !== undefined && listing.stock_quantity <= 3 && (
            <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              Only {listing.stock_quantity} left
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-2 flex-shrink-0">
        <h3 className="font-semibold line-clamp-2">{listing.title}</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">${priceFormatted}</span>
          <Button size="sm" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </Button>
        </div>

        {/* Seller */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full bg-muted" />
          <span>View seller</span>
        </div>
      </div>
    </Card>
  );
}
