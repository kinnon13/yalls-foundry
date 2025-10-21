import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FolderSync, Loader2 } from 'lucide-react';

interface OrganizeButtonProps {
  threadId: string | null;
}

export function OrganizeButton({ threadId }: OrganizeButtonProps) {
  const { toast } = useToast();
  const [isOrganizing, setIsOrganizing] = useState(false);

  const handleOrganize = async () => {
    if (!threadId) {
      toast({
        title: 'No thread selected',
        description: 'Start a conversation first',
        variant: 'destructive',
      });
      return;
    }

    setIsOrganizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-organize-knowledge', {
        body: { thread_id: threadId }
      });

      if (error) throw error;

      toast({
        title: 'Knowledge organized',
        description: `Filed: ${data.file.name} → ${data.file.category}`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to organize',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsOrganizing(false);
    }
  };

  return (
    <Button
      onClick={handleOrganize}
      disabled={isOrganizing || !threadId}
      variant="outline"
      size="sm"
    >
      {isOrganizing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Organizing...
        </>
      ) : (
        <>
          <FolderSync className="h-4 w-4 mr-2" />
          Organize Knowledge
        </>
      )}
    </Button>
  );
}
