import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorite } from '@/hooks/useFavorite';
import { FavoriteType } from '@/ports/favorites';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
  userId: string;
  fav_type: FavoriteType;
  ref_id: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FavoriteButton({ userId, fav_type, ref_id, size = 'md', className }: FavoriteButtonProps) {
  const { data: favorites = [], toggle } = useFavorite(userId, fav_type);
  const [isAnimating, setIsAnimating] = useState(false);

  const isFavorited = favorites.some(f => f.fav_type === fav_type && f.ref_id === ref_id);

  const handleClick = () => {
    setIsAnimating(true);
    toggle.mutate({ fav_type, ref_id });
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(sizeClasses[size], className)}
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorited}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-all',
          isFavorited && 'fill-destructive text-destructive',
          isAnimating && 'scale-125'
        )}
      />
    </Button>
  );
}
