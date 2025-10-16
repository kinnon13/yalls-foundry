import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveTenantId } from '@/lib/tenancy/context';
import { useToast } from '@/hooks/use-toast';

export type FeedLayout = 'auto' | 'tiktok' | 'instagram' | 'facebook';

interface FeedPreferences {
  feed_layout: FeedLayout;
  hidden_users: string[];
  hidden_topics: string[];
  boosted_users: string[];
  boosted_topics: string[];
  tiktok_interactions: number;
  instagram_interactions: number;
  facebook_interactions: number;
}

export function useFeedPreferences() {
  const [preferences, setPreferences] = useState<FeedPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const tenantId = await resolveTenantId(user.id);

      const { data, error } = await supabase
        .from('user_feed_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data as FeedPreferences);
      } else {
        // Create default preferences
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_feed_preferences')
          .insert({
            user_id: user.id,
            tenant_id: tenantId,
            feed_layout: 'auto'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs as FeedPreferences);
      }
    } catch (error) {
      console.error('Error loading feed preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLayout = async (layout: FeedLayout) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tenantId = await resolveTenantId(user.id);

      const { error } = await supabase
        .from('user_feed_preferences')
        .update({ feed_layout: layout })
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, feed_layout: layout } : null);
      toast({
        title: 'Feed layout updated',
        description: `Switched to ${layout} style feed`
      });
    } catch (error) {
      console.error('Error updating layout:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feed layout',
        variant: 'destructive'
      });
    }
  };

  const hideUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !preferences) return;

      const tenantId = await resolveTenantId(user.id);
      const newHiddenUsers = [...preferences.hidden_users, userId];

      const { error } = await supabase
        .from('user_feed_preferences')
        .update({ hidden_users: newHiddenUsers })
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, hidden_users: newHiddenUsers } : null);
      toast({ title: 'User hidden from feed' });
    } catch (error) {
      console.error('Error hiding user:', error);
    }
  };

  const unhideUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !preferences) return;

      const tenantId = await resolveTenantId(user.id);
      const newHiddenUsers = preferences.hidden_users.filter(id => id !== userId);

      const { error } = await supabase
        .from('user_feed_preferences')
        .update({ hidden_users: newHiddenUsers })
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, hidden_users: newHiddenUsers } : null);
      toast({ title: 'User unhidden from feed' });
    } catch (error) {
      console.error('Error unhiding user:', error);
    }
  };

  const trackInteraction = async (layout: 'tiktok' | 'instagram' | 'facebook') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !preferences) return;

      const tenantId = await resolveTenantId(user.id);
      const field = `${layout}_interactions`;
      const newCount = (preferences[field] || 0) + 1;

      const { error } = await supabase
        .from('user_feed_preferences')
        .update({ [field]: newCount })
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, [field]: newCount } : null);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const getDetectedLayout = (): FeedLayout => {
    if (!preferences || preferences.feed_layout !== 'auto') {
      return preferences?.feed_layout || 'auto';
    }

    const { tiktok_interactions, instagram_interactions, facebook_interactions } = preferences;
    const max = Math.max(tiktok_interactions, instagram_interactions, facebook_interactions);

    if (max === 0) return 'instagram'; // Default to Instagram style

    if (tiktok_interactions === max) return 'tiktok';
    if (instagram_interactions === max) return 'instagram';
    return 'facebook';
  };

  return {
    preferences,
    loading,
    updateLayout,
    hideUser,
    unhideUser,
    trackInteraction,
    detectedLayout: getDetectedLayout(),
    isUserHidden: (userId: string) => preferences?.hidden_users.includes(userId) || false
  };
}
