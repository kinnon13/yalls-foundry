/**
 * Referral Search Hook
 * 
 * Debounced profile search with abort controller to prevent race conditions.
 * Parses @username, username, or referral links.
 */

import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ProfileResult {
  user_id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Parse handle from various input formats
 * - @username → username
 * - username → username
 * - yalls.ai?ref=username → username
 */
const parseHandle = (raw: string): string => {
  const v = (raw || '').trim();
  if (!v) return '';
  
  // Strip leading @
  if (v.startsWith('@')) return v.slice(1);
  
  // Extract from referral link
  try {
    const url = new URL(v);
    const ref = url.searchParams.get('ref');
    if (ref) return ref.replace(/^@/, '');
  } catch {
    // Not a valid URL, continue
  }
  
  return v;
};

export function useReferralSearch(
  supabase: SupabaseClient,
  delay: number = 500
) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search with abort
  useEffect(() => {
    const handle = parseHandle(query);
    
    if (!handle) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(async () => {
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      try {
        const { data, error: rpcError } = await supabase.rpc(
          'search_profiles_prefix',
          { q: handle, lim: 10 }
        );

        if (rpcError) throw rpcError;
        setItems((data as ProfileResult[]) ?? []);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Profile search error:', e);
          setError('Search failed');
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query, supabase, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    items,
    loading,
    error,
    parseHandle,
  };
}
