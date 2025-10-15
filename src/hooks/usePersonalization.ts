/**
 * Personalization Hook
 * 
 * Tracks user interactions and fetches personalized content
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePersonalization() {
  const { toast } = useToast();

  // Track user interaction
  const trackInteraction = useCallback(async (
    traceType: 'view' | 'click' | 'search' | 'purchase' | 'save',
    entityType: string,
    entityId: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Don't track anonymous users

      const { error } = await (supabase.rpc as any)('track_interaction', {
        p_trace_type: traceType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_metadata: metadata,
      });

      if (error) {
        console.error('Failed to track interaction:', error);
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }, []);

  // Get personalized rankings
  const getPersonalizedFeed = useCallback(async (
    entityType: string,
    limit: number = 20
  ) => {
    try {
      const { data, error } = await (supabase.rpc as any)('get_personalized_rankings', {
        p_entity_type: entityType,
        p_limit: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching personalized feed:', error);
      return [];
    }
  }, []);

  // Submit platform suggestion
  const submitSuggestion = useCallback(async (
    suggestionType: string,
    title: string,
    description: string,
    config: Record<string, any> = {}
  ) => {
    try {
      const { data, error } = await (supabase.rpc as any)('submit_suggestion', {
        p_suggestion_type: suggestionType,
        p_title: title,
        p_description: description,
        p_config: config,
      });

      if (error) throw error;

      toast({
        title: 'Suggestion Submitted',
        description: 'Thank you! Our AI will analyze your suggestion.',
      });

      return data;
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit suggestion. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Trigger trace analysis (called periodically)
  const analyzeTraces = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.functions.invoke('analyze-traces', {
        body: { user_id: user.id },
      });
    } catch (error) {
      console.error('Error analyzing traces:', error);
    }
  }, []);

  // Auto-analyze traces every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      analyzeTraces();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [analyzeTraces]);

  return {
    trackInteraction,
    getPersonalizedFeed,
    submitSuggestion,
    analyzeTraces,
  };
}
