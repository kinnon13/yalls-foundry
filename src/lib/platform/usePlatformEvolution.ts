/**
 * Platform Evolution Hook
 * 
 * Client-side utilities for submitting corrections, viewing suggestions,
 * and triggering trace analysis.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { resolveTenantId } from '@/lib/tenancy/context';

export interface Correction {
  correction_type: 'missing_category' | 'missing_tool' | 'missing_tab' | 'wrong_result';
  original_content: string;
  corrected_content: string;
  metadata?: Record<string, any>;
}

export interface Suggestion {
  id: string;
  suggestion_type: 'category' | 'tool' | 'tab' | 'feature';
  title: string;
  description: string;
  config: Record<string, any>;
  supporting_traces_count: number;
  interest_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

export function usePlatformEvolution() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submitCorrection = async (correction: Correction) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tenantId = await resolveTenantId(user.id);
      // @ts-ignore - Type will be available after Supabase regenerates types
      const { error } = await supabase.from('ai_corrections').insert({
        tenant_id: tenantId,
        user_id: user.id,
        ...correction,
      });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Your suggestion will help improve the platform!",
      });

      return true;
    } catch (error) {
      console.error('Error submitting correction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to submit feedback',
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async (status?: string) => {
    setLoading(true);
    try {
      // @ts-ignore - Type will be available after Supabase regenerates types
      let query = (supabase as any)
        .from('platform_suggestions')
        .select('*')
        .order('interest_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as any as Suggestion[];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to load suggestions",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const approveSuggestion = async (suggestionId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - Type will be available after Supabase regenerates types
      const { data, error } = await supabase.rpc('approve_suggestion', {
        p_suggestion_id: suggestionId,
        p_approver_id: user.id,
      });

      if (error) throw error;

      const result = data as { ok: boolean; error?: string; delta_id?: string };

      if (!result.ok) {
        throw new Error(result.error || 'Approval failed');
      }

      toast({
        title: "Suggestion approved",
        description: "Platform morph initiated!",
      });

      return true;
    } catch (error) {
      console.error('Error approving suggestion:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to approve',
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectSuggestion = async (suggestionId: string) => {
    setLoading(true);
    try {
      // @ts-ignore - Type will be available after Supabase regenerates types
      const { error } = await (supabase as any)
        .from('platform_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

      if (error) throw error;

      toast({
        title: "Suggestion rejected",
        description: "Thank you for your review",
      });

      return true;
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to reject suggestion",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const analyzeTraces = async (traces: any[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-traces', {
        body: { traces },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error analyzing traces:', error);
      toast({
        title: "Error",
        description: "Failed to analyze traces",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchSimilar = async (query: string, type?: string) => {
    setLoading(true);
    try {
      // First, generate embedding for the query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
        'generate-embeddings',
        {
          body: {
            chunks: [
              {
                chunk_type: 'query',
                source_id: 'search_' + Date.now(),
                source_table: 'search_queries',
                content: query,
              },
            ],
          },
        }
      );

      if (embeddingError) throw embeddingError;

      // Then search using the embedding
      const embedding = embeddingData.results[0]?.embedding;
      if (!embedding) throw new Error('Failed to generate embedding');

      // @ts-ignore - Type will be available after Supabase regenerates types
      const { data, error } = await supabase.rpc('search_similar_chunks', {
        p_embedding: embedding,
        p_type: type,
        p_limit: 20,
        p_similarity_threshold: 0.8,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: "Error",
        description: "Search failed",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitCorrection,
    getSuggestions,
    approveSuggestion,
    rejectSuggestion,
    analyzeTraces,
    searchSimilar,
  };
}
