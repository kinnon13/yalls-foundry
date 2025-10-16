/**
 * Button to trigger memory backfill from conversation history
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function BackfillMemoriesButton() {
  const [loading, setLoading] = useState(false);

  const handleBackfill = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-memories', {
        body: {}
      });

      if (error) {
        throw error;
      }

      const count = data?.totalExtracted || data || 0;
      
      toast({
        title: "Memories Analyzed",
        description: `Extracted ${count} memories from your conversations. Refresh to see them.`,
      });

      // Trigger page refresh after a moment
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (err) {
      console.error('Backfill error:', err);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : 'Could not analyze conversations',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleBackfill}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Brain className="w-4 h-4 mr-2" />
          Analyze Past Conversations
        </>
      )}
    </Button>
  );
}
