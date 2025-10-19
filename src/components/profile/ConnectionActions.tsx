/**
 * Connection Actions Component
 * Follow/Favorite buttons with consent and CRM integration
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, UserPlus, UserCheck } from 'lucide-react';
import { useConnection, usePublicCounters } from '@/hooks/usePublicApps';
import { UnfollowModal } from './UnfollowModal';
import { toast } from 'sonner';
import { rocker } from '@/lib/rocker/event-bus';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionActionsProps {
  entityId: string;
  entityName: string;
}

export function ConnectionActions({ entityId, entityName }: ConnectionActionsProps) {
  const { isFollowing, isFavorited, toggleFollow, toggleFavorite, loading } = useConnection(entityId);
  const counters = usePublicCounters(entityId);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  const handleFollowClick = async () => {
    if (isFollowing) {
      setShowUnfollowModal(true);
      return;
    }

    // Instant follow: one RPC does follow + pin + CRM
    rocker.emit('connection_follow_initiated', {
      metadata: { entityId, entityName }
    });

    try {
      const { data, error } = await supabase.rpc('follow_and_pin', {
        p_business_id: entityId,
        p_apps: [],
      });

      if (error) throw error;

      const result = data as { ok: boolean; pin_id?: string; contact_id?: string } | null;

      toast.success(`Following ${entityName}. Pinned to dashboard.`);
      
      rocker.emit('connection_follow_completed', {
        metadata: { entityId, entityName, pinId: result?.pin_id }
      });

      rocker.emit('pin_autocreated', {
        metadata: { entityId, pinId: result?.pin_id }
      });

      rocker.emit('crm_contact_upserted', {
        metadata: { entityId, contactId: result?.contact_id }
      });

      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow. Please try again.');
    }
  };

  const handleUnfollowAction = async (action: 'silent_unsubscribe' | 'unfollow' | 'block') => {
    rocker.emit(`connection_unfollow_${action}`, {
      metadata: { entityId, entityName, action }
    });

    try {
      const { error } = await supabase.rpc('unfollow_options', {
        p_business_id: entityId,
        p_mode: action,
      });

      if (error) throw error;

      const messages = {
        silent_unsubscribe: 'Notifications muted but connection maintained',
        unfollow: 'Unfollowed successfully',
        block: 'Business blocked successfully',
      };
      
      toast.success(messages[action]);
      
      rocker.emit('connection_unfollow_completed', {
        metadata: { entityId, action }
      });

      window.location.reload();
    } catch (error) {
      console.error('Unfollow error:', error);
      toast.error('Failed to process action. Please try again.');
    }
  };

  const handleFavoriteClick = async () => {
    rocker.emit('connection_favorite_toggle', {
      metadata: { entityId, entityName, isFavorited: !isFavorited }
    });

    try {
      await toggleFavorite();
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={isFollowing ? 'secondary' : 'default'}
          size="sm"
          onClick={handleFollowClick}
          disabled={loading}
          className="gap-2"
        >
          {isFollowing ? (
            <>
              <UserCheck className="h-4 w-4" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Follow
            </>
          )}
          {counters.followersCount > 0 && (
            <span className="text-xs">({counters.followersCount})</span>
          )}
        </Button>

        <Button
          variant={isFavorited ? 'secondary' : 'outline'}
          size="sm"
          onClick={handleFavoriteClick}
          disabled={loading}
          className="gap-2"
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          Favorite
          {counters.favoritesCount > 0 && (
            <span className="text-xs">({counters.favoritesCount})</span>
          )}
        </Button>
      </div>

      <UnfollowModal
        open={showUnfollowModal}
        onOpenChange={setShowUnfollowModal}
        onAction={handleUnfollowAction}
        businessName={entityName}
      />
    </>
  );
}
