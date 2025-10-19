/**
 * Connection Actions Component
 * Follow/Favorite buttons with consent and CRM integration
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, UserPlus, UserCheck } from 'lucide-react';
import { useConnection, usePublicCounters } from '@/hooks/usePublicApps';
import { ConsentModal } from './ConsentModal';
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
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  const handleFollowClick = () => {
    if (isFollowing) {
      setShowUnfollowModal(true);
    } else {
      setShowConsentModal(true);
    }
  };

  const handleConsentConfirm = async () => {
    setShowConsentModal(false);
    
    rocker.emit('connection_follow_initiated', {
      metadata: { entityId, entityName }
    });

    try {
      // Get user profile for CRM
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Please sign in to follow');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.user.id)
        .single();

      // Follow + auto-pin
      const result = await toggleFollow();
      
      if (result) {
        // Create CRM contact
        await supabase.rpc('crm_upsert_contact', {
          p_business_id: entityId,
          p_name: profile?.display_name || user.user.email?.split('@')[0] || 'User',
          p_phone: null, // Phone not on profiles table yet
        });

        toast.success(`Following ${entityName}. Added to your pinboard.`);
        
        rocker.emit('connection_follow_completed', {
          metadata: { entityId, entityName }
        });
      }
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
      // Call unfollow RPC with action
      const { data, error } = await supabase.rpc('connection_unfollow', {
        p_entity_id: entityId,
        p_action: action,
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

      // Reload connection state
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

      <ConsentModal
        open={showConsentModal}
        onOpenChange={setShowConsentModal}
        onConfirm={handleConsentConfirm}
        businessName={entityName}
      />

      <UnfollowModal
        open={showUnfollowModal}
        onOpenChange={setShowUnfollowModal}
        onAction={handleUnfollowAction}
        businessName={entityName}
      />
    </>
  );
}
