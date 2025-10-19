/**
 * Public Apps Hook
 * Manages public app visibility and connection edges
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rocker } from '@/lib/rocker/event-bus';

export interface PublicApp {
  id: string;
  appId: string;
  visible: boolean;
  config: Record<string, any>;
}

export interface ConnectionEdge {
  id: string;
  userId: string;
  entityId: string;
  edgeType: 'follow' | 'favorite';
  scope: { apps?: string[] };
  createdAt: string;
}

export interface PublicCounters {
  likesCount: number;
  favoritesCount: number;
  followersCount: number;
}

export function usePublicApps(entityId: string) {
  const [apps, setApps] = useState<PublicApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;

    async function loadApps() {
      const { data, error } = await supabase
        .from('public_app_visibility')
        .select('*')
        .eq('entity_id', entityId)
        .eq('visible', true);

      if (!error && data) {
        setApps(data.map(row => ({
          id: row.id,
          appId: row.app_id,
          visible: row.visible,
          config: (row.config as any) || {},
        })));
      }
      setLoading(false);
    }

    loadApps();
  }, [entityId]);

  return { apps, loading };
}

export function useConnection(entityId: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;

    async function checkConnection() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('connection_edges')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('entity_id', entityId);

      if (!error && data) {
        setIsFollowing(data.some(e => e.edge_type === 'follow'));
        setIsFavorited(data.some(e => e.edge_type === 'favorite'));
      }
      setLoading(false);
    }

    checkConnection();
  }, [entityId]);

  const toggleConnection = async (edgeType: 'follow' | 'favorite', apps?: string[]) => {
    try {
      const { data, error } = await supabase.rpc('connection_toggle', {
        p_entity_id: entityId,
        p_edge_type: edgeType,
        p_apps: apps || null,
      });

      if (error) throw error;

      const result = data as any;
      if (edgeType === 'follow') {
        setIsFollowing(result.is_connected);
        
        // Auto-pin business on follow (if connected)
        if (result.is_connected && edgeType === 'follow') {
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            // Call auto-pin edge function
            supabase.functions.invoke('auto-pin-business', {
              body: {
                userId: user.user.id,
                businessId: entityId,
                apps: apps || [],
              },
            }).then(({ data: pinData, error: pinError }) => {
              if (pinError) {
                console.error('[auto-pin] Failed:', pinError);
              } else {
                console.log('[auto-pin] Success:', pinData);
                rocker.emit('pin_autocreated', {
                  metadata: { 
                    userId: user.user.id, 
                    businessId: entityId, 
                    origin: 'auto_follow',
                    pinId: pinData?.pinId,
                  },
                });
              }
            });
          }
        }
      } else {
        setIsFavorited(result.is_connected);
      }

      rocker.emit(`connection_${edgeType}`, {
        metadata: { entityId, connected: result.is_connected },
      });

      return result;
    } catch (error) {
      console.error('Failed to toggle connection:', error);
      throw error;
    }
  };

  return {
    isFollowing,
    isFavorited,
    loading,
    toggleFollow: (apps?: string[]) => toggleConnection('follow', apps),
    toggleFavorite: (apps?: string[]) => toggleConnection('favorite', apps),
  };
}

export function usePublicCounters(entityId: string) {
  const [counters, setCounters] = useState<PublicCounters>({
    likesCount: 0,
    favoritesCount: 0,
    followersCount: 0,
  });

  useEffect(() => {
    if (!entityId) return;

    async function loadCounters() {
      const { data, error } = await supabase
        .from('public_counters')
        .select('*')
        .eq('entity_id', entityId)
        .single();

      if (!error && data) {
        setCounters({
          likesCount: data.likes_count || 0,
          favoritesCount: data.favorites_count || 0,
          followersCount: data.followers_count || 0,
        });
      }
    }

    loadCounters();

    // Realtime subscription
    const channel = supabase
      .channel(`counters:${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_counters',
          filter: `entity_id=eq.${entityId}`,
        },
        (payload) => {
          if (payload.new) {
            setCounters({
              likesCount: (payload.new as any).likes_count || 0,
              favoritesCount: (payload.new as any).favorites_count || 0,
              followersCount: (payload.new as any).followers_count || 0,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId]);

  return counters;
}
