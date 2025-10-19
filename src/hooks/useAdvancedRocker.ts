/**
 * Advanced Rocker AI Hook
 * Profile-aware AI with predictive suggestions and context management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';

export interface RockerSuggestion {
  id: string;
  suggestion_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action_data: Record<string, any>;
  confidence: number;
  status: 'pending' | 'dismissed' | 'acted_on';
  created_at: string;
}

export function useAdvancedRocker() {
  const queryClient = useQueryClient();
  const { activeProfile } = useProfile();
  const { toast } = useToast();

  // Fetch AI suggestions for active profile
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['rocker-suggestions', activeProfile?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const query = supabase
        .from('rocker_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('confidence', { ascending: false });

      if (activeProfile) {
        query.eq('profile_id', activeProfile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RockerSuggestion[];
    },
    enabled: true
  });

  // Generate new suggestions based on context
  const generateSuggestions = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call edge function to analyze patterns and generate suggestions
      const { data, error } = await supabase.functions.invoke('rocker-analyze', {
        body: {
          userId: user.id,
          profileId: activeProfile?.id,
          action: 'generate_suggestions'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rocker-suggestions'] });
      toast({
        title: 'Rocker analyzed your activity',
        description: 'New suggestions are available'
      });
    }
  });

  // Dismiss a suggestion
  const dismissSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('rocker_suggestions')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rocker-suggestions'] });
    }
  });

  // Act on a suggestion
  const actOnSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('rocker_suggestions')
        .update({ status: 'acted_on', acted_on_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rocker-suggestions'] });
      toast({
        title: 'Action completed',
        description: 'Rocker is learning from your actions'
      });
    }
  });

  // Save context for AI learning
  const saveContext = useMutation({
    mutationFn: async (context: {
      type: string;
      data: Record<string, any>;
      relevance?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('rocker_context')
        .insert({
          user_id: user.id,
          profile_id: activeProfile?.id,
          context_type: context.type,
          context_data: context.data,
          relevance_score: context.relevance || 1.0
        });

      if (error) throw error;
    }
  });

  return {
    suggestions,
    isLoading,
    generateSuggestions: generateSuggestions.mutate,
    dismissSuggestion: dismissSuggestion.mutate,
    actOnSuggestion: actOnSuggestion.mutate,
    saveContext: saveContext.mutate,
    isGenerating: generateSuggestions.isPending
  };
}
