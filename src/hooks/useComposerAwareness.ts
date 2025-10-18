/**
 * Composer Awareness for Rocker
 * 
 * Makes Rocker aware of when users are typing in the composer
 * Enables smart features like:
 * - Pausing responses while user is typing
 * - Optional AI suggestions after idle (opt-in)
 * - Better timing for proactive help
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RockerTypingEvent, RockerSuggestEvent } from './useRockerTyping';

export interface ComposerState {
  isTyping: boolean;
  lastSource?: string;
  lastLength?: number;
}

export interface SuggestionState {
  text?: string;
  source?: string;
  timestamp?: Date;
}

export function useComposerAwareness() {
  const [composerState, setComposerState] = useState<ComposerState>({ isTyping: false });
  const [lastSuggestion, setLastSuggestion] = useState<SuggestionState>({});
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [lastSuggestTime, setLastSuggestTime] = useState(0);
  const { toast } = useToast();

  // Listen to typing events
  useEffect(() => {
    const onTyping = (e: Event) => {
      const { type, source, length } = (e as CustomEvent).detail as RockerTypingEvent;
      
      // Typing event tracked

      if (type === 'start' || type === 'update') {
        setComposerState({ isTyping: true, lastSource: source, lastLength: length });
      } else if (type === 'stop') {
        setComposerState({ isTyping: false, lastSource: source, lastLength: length });
      }
    };

    window.addEventListener('rocker:typing', onTyping);
    return () => window.removeEventListener('rocker:typing', onTyping);
  }, []);

  // Listen to suggestion requests (only fires if user opted in)
  useEffect(() => {
    const onSuggest = async (e: Event) => {
      const { source, text } = (e as CustomEvent).detail as RockerSuggestEvent;
      
      // Suggestion requested

      // Check if feature is enabled globally (admin flag)
      const { isEnabled } = await import('@/lib/flags');
      const featureEnabled = isEnabled('rocker_always_on');
      if (!featureEnabled) {
        // Composer coach disabled globally
        return;
      }

      // Check if user has enabled suggestions via localStorage (no DB needed)
      const suggestionsEnabled = localStorage.getItem('rocker-suggestions-enabled') === 'true';
      if (!suggestionsEnabled) {
        // Suggestions disabled by user preference
        return;
      }

      // Rate limit: min 10s between suggestions
      const now = Date.now();
      if (now - lastSuggestTime < 10000) {
        // Rate limited, skipping suggestion
        return;
      }
      setLastSuggestTime(now);

      // Skip very short posts (< 5 words)
      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount < 5) {
        // Text too short, skipping suggestion
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        setIsLoadingSuggestion(true);

        // Call suggestion edge function
        const { data, error } = await supabase.functions.invoke('rocker-suggest-post', {
          body: { text, mode: 'caption' }
        });

        if (error) throw error;

        if (data?.suggestion) {
          setLastSuggestion({
            text: data.suggestion,
            source,
            timestamp: new Date()
          });

          // Emit hint event for UI to display
          window.dispatchEvent(new CustomEvent('rocker:hint', {
            detail: { suggestion: data.suggestion, source }
          }));

          // Suggestion generated
        }
      } catch (err: any) {
        console.error('[Composer Awareness] Suggestion error:', err);
        
        // Don't toast for every error, just log it
        if (err.message?.includes('disabled')) {
          // Coaching disabled
        }
      } finally {
        setIsLoadingSuggestion(false);
      }
    };

    window.addEventListener('rocker:suggest', onSuggest);
    return () => window.removeEventListener('rocker:suggest', onSuggest);
  }, [toast, lastSuggestTime]);

  // Helper to check if Rocker should pause
  const shouldPauseRocker = useCallback(() => {
    return composerState.isTyping;
  }, [composerState.isTyping]);

  // Helper to log suggestion acceptance/dismissal
  const logSuggestionFeedback = useCallback(async (accepted: boolean) => {
    if (!lastSuggestion.text) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('ai_feedback').insert({
        user_id: user.id,
        route: window.location.pathname,
        action: 'composer_suggestion',
        target: lastSuggestion.source || 'composer',
        success: accepted,
        message: accepted ? 'accepted' : 'dismissed',
        kind: 'behavioral',
        payload: {
          suggestion: lastSuggestion.text,
          length: lastSuggestion.text.length,
          timestamp: lastSuggestion.timestamp?.toISOString()
        }
      });

      // Logged suggestion feedback
    } catch (err) {
      console.error('[Composer Awareness] Failed to log feedback:', err);
    }
  }, [lastSuggestion]);

  return {
    isTyping: composerState.isTyping,
    lastSource: composerState.lastSource,
    lastLength: composerState.lastLength,
    lastSuggestion: lastSuggestion.text,
    isLoadingSuggestion,
    shouldPauseRocker,
    logSuggestionFeedback
  };
}
