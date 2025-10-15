import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { rockerBus } from '@/lib/ai/rocker/bus';
import { resolveTenantId } from '@/lib/tenancy/context';

interface SavePostOptions {
  post_id: string;
  collection?: string;
  note?: string;
}

interface ResharePostOptions {
  post_id: string;
  commentary?: string;
  visibility?: 'public' | 'followers' | 'private';
}

interface RecallResult {
  type: 'post' | 'profile' | 'horse';
  id: string;
  data: any;
  confidence: number;
  source: string;
  url: string;
}

export function usePostActions() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const savePost = async (options: SavePostOptions) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-post', {
        body: options,
      });

      if (error) throw error;

      // ROCKER BUS: Emit save event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const tenantId = await resolveTenantId(user.id);
        await rockerBus.emit({
          type: 'user.save.post',
          userId: user.id,
          tenantId,
          payload: { post_id: options.post_id, collection: options.collection, note: options.note }
        });
      }

      toast({
        title: 'Post saved',
        description: `Saved to ${options.collection || 'All'}`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save post',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const unsavePost = async (post_id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('unsave-post', {
        body: { post_id },
      });

      if (error) throw error;

      toast({
        title: 'Post unsaved',
        description: 'Removed from your saved posts',
      });

      return { success: true };
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unsave post',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const resharePost = async (options: ResharePostOptions) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reshare-post', {
        body: options,
      });

      if (error) throw error;

      // ROCKER BUS: Emit reshare event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const tenantId = await resolveTenantId(user.id);
        await rockerBus.emit({
          type: 'user.reshare.post',
          userId: user.id,
          tenantId,
          payload: { post_id: options.post_id, commentary: options.commentary, visibility: options.visibility }
        });
      }

      toast({
        title: 'Post reshared',
        description: 'Successfully shared with your network',
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error resharing post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reshare post',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const recallContent = async (query: string): Promise<RecallResult[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recall-content', {
        body: { query },
      });

      if (error) throw error;

      return data?.results || [];
    } catch (error) {
      console.error('Error recalling content:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to recall content',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSavedPosts = async (collection?: string) => {
    try {
      const query = supabase
        .from('post_saves')
        .select('*, posts(*)')
        .order('created_at', { ascending: false });

      if (collection) {
        query.eq('collection', collection);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch saved posts',
        variant: 'destructive',
      });
      return [];
    }
  };

  const getUserReshares = async () => {
    try {
      const { data, error } = await supabase
        .from('post_reshares')
        .select('*, posts(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching reshares:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch reshares',
        variant: 'destructive',
      });
      return [];
    }
  };

  return {
    loading,
    savePost,
    unsavePost,
    resharePost,
    recallContent,
    getSavedPosts,
    getUserReshares,
  };
}
