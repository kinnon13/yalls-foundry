/**
 * Rocker Typing Detection Hook
 * 
 * Detects when users are typing in the post composer and notifies Rocker
 * via local window events (no network spam, privacy-first).
 */

import { useEffect } from 'react';

export interface RockerTypingOptions {
  /** Enable AI suggestions after idle (default: false, opt-in only) */
  enableSuggestions?: boolean;
  /** Minimum characters before suggesting (default: 20) */
  minChars?: number;
  /** Milliseconds of idle before triggering suggestion (default: 1200) */
  idleMs?: number;
  /** Source identifier for telemetry (default: 'composer') */
  source?: string;
}

export interface RockerTypingEvent {
  type: 'start' | 'stop' | 'update';
  source: string;
  length?: number;
  text?: string;
}

export interface RockerSuggestEvent {
  source: string;
  text: string;
}

/**
 * Hook up typing detection on a textarea/input element
 * Emits window events that Rocker can listen to
 */
export function useRockerTyping(
  ref: React.RefObject<HTMLTextAreaElement | HTMLInputElement>,
  opts: RockerTypingOptions = {}
) {
  const {
    enableSuggestions = false,
    minChars = 20,
    idleMs = 1200,
    source = 'composer'
  } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let idleTimer: number | undefined;
    let lastValue = '';
    let isActive = false;

    const emit = (type: 'start' | 'stop' | 'update', detail: Partial<RockerTypingEvent> = {}) => {
      const event: RockerTypingEvent = {
        type,
        source,
        ...detail
      };
      window.dispatchEvent(new CustomEvent('rocker:typing', { detail: event }));
      console.log('[Rocker Typing]', event);
    };

    const onInput = () => {
      const val = el.value ?? '';
      const started = !isActive && val.length > 0;
      lastValue = val;

      if (started) {
        isActive = true;
        emit('start', { source });
      }

      emit('update', { source, length: val.length });

      // Clear previous idle timer
      window.clearTimeout(idleTimer);

      // Set new idle timer
      idleTimer = window.setTimeout(() => {
        isActive = false;
        emit('stop', { source, length: val.length });

        // Only trigger suggestions if enabled and meets criteria
        if (enableSuggestions && val.length >= minChars) {
          window.dispatchEvent(new CustomEvent('rocker:suggest', {
            detail: { source, text: val } as RockerSuggestEvent
          }));
          console.log('[Rocker Suggest] Requesting suggestion for', val.length, 'chars');
        }
      }, idleMs);
    };

    const onFocus = () => {
      if (el.value?.length > 0) {
        isActive = true;
        emit('start', { source });
      }
    };

    const onBlur = () => {
      window.clearTimeout(idleTimer);
      if (isActive) {
        isActive = false;
        emit('stop', { source, length: el.value?.length ?? 0 });
      }
    };

    el.addEventListener('input', onInput);
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onBlur);

    return () => {
      el.removeEventListener('input', onInput);
      el.removeEventListener('focus', onFocus);
      el.removeEventListener('blur', onBlur);
      window.clearTimeout(idleTimer);
    };
  }, [ref, enableSuggestions, minChars, idleMs, source]);
}

/**
 * Hook to listen to typing events (for Rocker or other components)
 */
export function useRockerTypingListener(
  onTyping: (event: RockerTypingEvent) => void
) {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as RockerTypingEvent;
      onTyping(detail);
    };

    window.addEventListener('rocker:typing', handler);
    return () => window.removeEventListener('rocker:typing', handler);
  }, [onTyping]);
}

/**
 * Hook to listen to suggestion requests
 */
export function useRockerSuggestListener(
  onSuggest: (event: RockerSuggestEvent) => void
) {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as RockerSuggestEvent;
      onSuggest(detail);
    };

    window.addEventListener('rocker:suggest', handler);
    return () => window.removeEventListener('rocker:suggest', handler);
  }, [onSuggest]);
}
