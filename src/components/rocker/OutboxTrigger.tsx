/**
 * Manual Outbox Trigger
 * Sends queued SMS messages immediately
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function OutboxTrigger() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTrigger = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-send-outbox');
      
      if (error) throw error;
      
      const result = data as { processed: number; succeeded: number; failed: number };
      
      if (result.succeeded > 0) {
        toast.success(`Sent ${result.succeeded} message(s)!`);
      } else if (result.processed === 0) {
        toast.info('No messages in queue');
      } else {
        toast.error(`Failed to send ${result.failed} message(s)`);
      }
    } catch (error: any) {
      console.error('Outbox error:', error);
      toast.error('Failed to process outbox');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="pt-6 flex items-center justify-between">
        <div>
          <p className="font-medium">SMS Queue</p>
          <p className="text-xs text-muted-foreground">
            Manually trigger SMS delivery
          </p>
        </div>
        <Button
          onClick={handleTrigger}
          disabled={isProcessing}
          size="sm"
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
