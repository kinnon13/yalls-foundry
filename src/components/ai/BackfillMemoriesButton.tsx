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
    
    toast({
      title: "🧠 Analyzing Your Conversations",
      description: "This will extract memories from all 71 of your past chats. May take 1-2 minutes...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('analyze-memories');

      if (error) {
        console.error('Backfill error details:', error);
        throw error;
      }

      const count = data?.totalExtracted || 0;
      
      if (count > 0) {
        toast({
          title: "✅ Success!",
          description: `Extracted ${count} memories from your conversations. Refreshing...`,
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast({
          title: "No New Memories",
          description: "Your conversations may have already been analyzed, or no memorable information was found.",
        });
      }
      
    } catch (err) {
      console.error('Backfill error:', err);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : 'Could not analyze conversations. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleBackfill}
      disabled={loading}
      variant="default"
      size="sm"
      className="w-full bg-gradient-to-r from-primary to-primary/80"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Analyzing 71 Chats...
        </>
      ) : (
        <>
          <Brain className="w-4 h-4 mr-2" />
          Extract Memories from 71 Chats
        </>
      )}
    </Button>
  );
}
