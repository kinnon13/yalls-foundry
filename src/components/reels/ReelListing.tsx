// ReelListing - Marketplace listing feed item (PR5)
import { ListingFeedItem } from '@/types/feed';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { logUsageEvent } from '@/lib/telemetry/usageEvents';
import { cn } from '@/lib/utils';

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
    <article className="relative h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-lg animate-scale-in">
      {/* Media carousel */}
      {currentMedia && (
        <div className="absolute inset-0">
          {currentMedia.type === 'video' ? (
            <video 
              src={currentMedia.url} 
              className="h-full w-full object-cover transition-opacity duration-300"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img 
              src={currentMedia.url} 
              alt={reel.title}
              className="h-full w-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Media indicators */}
      {media.length > 1 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 px-4 z-10">
          {media.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'h-1.5 flex-1 max-w-20 rounded-full transition-all duration-300',
                idx === currentIndex 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`View image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4 animate-slide-up">
        {/* Title and price */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold flex-1 text-primary-foreground">{reel.title}</h3>
          <Badge variant="secondary" className="bg-primary text-primary-foreground text-base px-3 py-1.5 shadow-md">
            ${(reel.price_cents / 100).toFixed(2)}
          </Badge>
        </div>

        {/* Stock indicator */}
        {reel.stock_quantity !== undefined && reel.stock_quantity <= 5 && (
          <Badge variant="destructive" className="animate-pulse-subtle">
            Only {reel.stock_quantity} left
          </Badge>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 transition-all duration-200 hover:scale-[1.02] shadow-lg"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
          <Button
            variant="outline"
            className="border-primary/30 text-primary-foreground hover:bg-primary/20 transition-all duration-200 hover:scale-105"
            asChild
          >
            <a href={`/entities/${reel.entity_id}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          More from this seller
        </p>
      </div>
    </article>
  );
}
