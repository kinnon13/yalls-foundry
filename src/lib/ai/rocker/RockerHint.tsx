/**
 * RockerHint - Single suggestion pill with optional action
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRocker } from './RockerProvider';
import { RockerWhy } from './RockerWhy';

interface RockerHintProps {
  suggestion: string;
  reason: string;
  action?: () => void | Promise<void>;
  actionLabel?: string;
  rateLimit?: string; // localStorage key for rate limiting
}

export function RockerHint({ 
  suggestion, 
  reason, 
  action, 
  actionLabel = 'Try it',
  rateLimit
}: RockerHintProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { log, section } = useRocker();

  useEffect(() => {
    // Check rate limit
    if (rateLimit) {
      const lastShown = localStorage.getItem(rateLimit);
      if (lastShown) {
        const daysSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) {
          return; // Don't show if shown within last day
        }
      }
    }
    
    setVisible(true);
    
    // Log impression
    log('rocker_hint_shown', { suggestion, section });
    
    // Mark as shown
    if (rateLimit) {
      localStorage.setItem(rateLimit, Date.now().toString());
    }
  }, [rateLimit, log, suggestion, section]);

  const handleDismiss = () => {
    setVisible(false);
    log('rocker_hint_dismissed', { suggestion, section });
  };

  const handleAccept = async () => {
    if (!action) return;
    
    setLoading(true);
    try {
      await action();
      log('rocker_hint_accepted', { suggestion, section }, {}, 'success');
      setVisible(false);
    } catch (error) {
      console.error('[RockerHint] Action failed:', error);
      log('rocker_hint_accepted', { suggestion, section }, {}, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
      <RockerWhy reason={reason} />
      {suggestion}
      {action && (
        <Button onClick={handleAccept} disabled={loading} size="sm" variant="outline">
          {loading ? 'Working...' : actionLabel}
        </Button>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto text-muted-foreground hover:text-foreground"
        aria-label="Dismiss suggestion"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
