// ReelListing - Marketplace listing feed item (PR5)
import { ListingFeedItem } from '@/types/feed';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { logUsageEvent } from '@/lib/telemetry/usageEvents';

interface ReelListingProps {
  reel: ListingFeedItem;
  onAddToCart?: () => void;
}

export function ReelListing({ reel, onAddToCart }: ReelListingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const media = reel.media || [];
  const currentMedia = media[currentIndex];

  const handleAddToCart = () => {
    logUsageEvent({
      eventType: 'add_to_cart',
      itemType: 'listing',
      itemId: reel.id,
      payload: { price_cents: reel.price_cents }
    });
    onAddToCart?.();
  };

  return (
    <article className="relative h-[80vh] w-full overflow-hidden rounded-xl bg-neutral-950 text-white">
      {/* Media carousel */}
      {currentMedia && (
        <div className="absolute inset-0">
          {currentMedia.type === 'video' ? (
            <video 
              src={currentMedia.url} 
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img 
              src={currentMedia.url} 
              alt={reel.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

      {/* Media indicators */}
      {media.length > 1 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
          {media.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
              aria-label={`View image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
        {/* Title and price */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold flex-1">{reel.title}</h3>
          <Badge variant="secondary" className="bg-white/90 text-black text-base px-3 py-1">
            ${(reel.price_cents / 100).toFixed(2)}
          </Badge>
        </div>

        {/* Stock indicator */}
        {reel.stock_quantity !== undefined && reel.stock_quantity <= 5 && (
          <Badge variant="destructive" className="bg-red-500/90">
            Only {reel.stock_quantity} left
          </Badge>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-white text-black hover:bg-white/90 gap-2"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            asChild
          >
            <a href={`/entities/${reel.entity_id}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <p className="text-sm text-white/70">
          More from this seller
        </p>
      </div>
    </article>
  );
}
