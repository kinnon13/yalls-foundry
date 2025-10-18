/**
 * RockerHint Component
 * Lightweight suggestion pill with dismiss
 */

import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhyThis } from './WhyThis';
import { useRocker } from '@/lib/ai/rocker/agent/useRocker';

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
    <div className="flex items-center gap-2 px-3 py-2 bg-accent/50 border border-accent rounded-lg text-sm">
      <Sparkles className="h-4 w-4 text-primary shrink-0" />
      <span className="flex-1">{suggestion}</span>
      <WhyThis reason={reason} />
      {action && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAccept}
          disabled={loading}
          className="h-7 px-2"
        >
          {loading ? 'Working...' : actionLabel}
        </Button>
      )}
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 hover:bg-muted rounded transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
