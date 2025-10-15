import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EntitySearchResult {
  entity_type: string;
  entity_id: string;
  name: string;
  image_url: string | null;
  is_public: boolean;
  similarity_score: number;
  metadata: any;
}

interface EntityPreview {
  type: 'profile' | 'horse' | 'business';
  id: string;
  name: string;
  image?: string;
  description?: string;
  metadata?: any;
  previewUrl?: string;
}

export const useEntityLookup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EntitySearchResult[]>([]);

  const searchEntities = async (query: string, context?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('entity-lookup', {
        body: { query, context }
      });

      if (error) throw error;

      setResults(data.results || []);
      return data.results || [];
    } catch (error) {
      console.error('Entity lookup error:', error);
      toast({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'Failed to search entities',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async (
    entityType: string,
    entityId: string
  ): Promise<EntityPreview | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-preview', {
        body: { entityType, entityId }
      });

      if (error) throw error;

      return data.preview;
    } catch (error) {
      console.error('Preview generation error:', error);
      toast({
        title: 'Preview Error',
        description: 'Failed to generate preview',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const extractEntityMentions = (text: string): string[] => {
    // Extract potential entity names from text
    // Looks for capitalized words/phrases that could be names
    const patterns = [
      // Full names (First Last)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
      // Horse names (often have descriptive multi-word names)
      /\b([A-Z][a-z]+(?:\s+(?:a|the|of|and)\s+)?[A-Z][a-z]+)\b/g,
      // Business names (can include Inc, LLC, etc)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Ranch|Farm|Stables)))\b/gi,
    ];

    const mentions = new Set<string>();
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => mentions.add(match.trim()));
      }
    });

    return Array.from(mentions);
  };

  return {
    loading,
    results,
    searchEntities,
    generatePreview,
    extractEntityMentions,
  };
};
