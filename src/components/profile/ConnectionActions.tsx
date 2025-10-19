/**
 * Connection Actions
 * Follow/Favorite buttons with counters
 */

import { Heart, UserPlus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnection, usePublicCounters } from '@/hooks/usePublicApps';
import { useState } from 'react';
import { toast } from 'sonner';

interface ConnectionActionsProps {
  entityId: string;
  entityName: string;
}

export function ConnectionActions({ entityId, entityName }: ConnectionActionsProps) {
  const { isFollowing, isFavorited, toggleFollow, toggleFavorite } = useConnection(entityId);
  const counters = usePublicCounters(entityId);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      await toggleFollow();
      toast.success(isFollowing ? `Unfollowed ${entityName}` : `Following ${entityName}`);
    } catch (error) {
      toast.error('Failed to update connection');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    setLoading(true);
    try {
      await toggleFavorite();
      toast.success(isFavorited ? `Removed from favorites` : `Added to favorites`);
    } catch (error) {
      toast.error('Failed to update favorite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={isFollowing ? 'secondary' : 'default'}
        size="sm"
        onClick={handleFollow}
        disabled={loading}
        className="gap-2"
      >
        <UserPlus className="h-4 w-4" />
        {isFollowing ? 'Following' : 'Follow'}
        {counters.followersCount > 0 && (
          <span className="text-xs">({counters.followersCount})</span>
        )}
      </Button>

      <Button
        variant={isFavorited ? 'secondary' : 'outline'}
        size="sm"
        onClick={handleFavorite}
        disabled={loading}
        className="gap-2"
      >
        <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
        Favorite
        {counters.favoritesCount > 0 && (
          <span className="text-xs">({counters.favoritesCount})</span>
        )}
      </Button>

      <Button variant="outline" size="sm" className="gap-2">
        <Bell className="h-4 w-4" />
        Notify
      </Button>
    </div>
  );
}
