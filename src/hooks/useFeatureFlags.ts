/**
 * Real-time Feature Flags Hook
 * 
 * Subscribes to feature flag changes and updates in real-time.
 * All users see feature changes instantly when admin toggles them.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  feature_key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  config: any;
  category: string;
  enabled_for_tenants: string[];
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [allFlags, setAllFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    const loadFlags = async () => {
      const { data } = await supabase
        .from('feature_flags')
        .select('*')
        .order('category', { ascending: true });

      if (data) {
        setAllFlags(data);
        const flagMap = data.reduce((acc, flag) => {
          acc[flag.feature_key] = flag.enabled;
          return acc;
        }, {} as Record<string, boolean>);
        setFlags(flagMap);
      }
      setLoading(false);
    };

    loadFlags();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('feature-flags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newFlag = payload.new as FeatureFlag;
            setFlags(prev => ({
              ...prev,
              [newFlag.feature_key]: newFlag.enabled,
            }));
            setAllFlags(prev => {
              const index = prev.findIndex(f => f.id === newFlag.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = newFlag;
                return updated;
              }
              return [...prev, newFlag];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldFlag = payload.old as FeatureFlag;
            setFlags(prev => {
              const updated = { ...prev };
              delete updated[oldFlag.feature_key];
              return updated;
            });
            setAllFlags(prev => prev.filter(f => f.id !== oldFlag.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isEnabled = (featureKey: string): boolean => {
    return flags[featureKey] || false;
  };

  const getConfig = (featureKey: string): Record<string, any> => {
    const flag = allFlags.find(f => f.feature_key === featureKey);
    return flag?.config || {};
  };

  return {
    flags,
    allFlags,
    loading,
    isEnabled,
    getConfig,
  };
}

export function useFeatureFlag(featureKey: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(featureKey);
}
