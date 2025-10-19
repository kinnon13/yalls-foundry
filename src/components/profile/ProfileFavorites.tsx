/**
 * ProfileFavorites - Display user's pinned favorites as circle icons
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserFavorites } from '@/hooks/useUserFavorites';
import { cn } from '@/lib/utils';

interface ProfileFavoritesProps {
  userId: string;
  className?: string;
}

export function ProfileFavorites({ userId, className }: ProfileFavoritesProps) {
  const { data: favorites, isLoading } = useUserFavorites(userId);

  if (isLoading || !favorites || favorites.length === 0) {
    return null;
  }

  return (
    <div className={cn('px-4 py-3 border-b border-border/50', className)}>
      <h3 className="text-xs font-semibold text-muted-foreground mb-2">Pinned Favorites</h3>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {favorites.map((favorite) => {
          const initials = favorite.display_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <button
              key={favorite.id}
              className="flex flex-col items-center gap-1 flex-shrink-0 hover:opacity-80 transition-opacity"
              onClick={() => {
                // Navigate to favorite profile/entity
                console.log('Navigate to:', favorite.ref_id, favorite.fav_type);
              }}
            >
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                <AvatarImage
                  src={favorite.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${favorite.ref_id}`}
                  alt={favorite.display_name}
                />
                <AvatarFallback className="text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground max-w-[56px] truncate">
                {favorite.display_name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
