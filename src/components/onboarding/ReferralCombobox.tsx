/**
 * Referral Combobox Component
 * 
 * Stable, accessible combobox that never loses focus.
 * - Debounced live search as you type
 * - Keyboard navigation (arrows, enter, escape)
 * - Clear button to reset
 * - Self-referral prevention
 * - No errors shown while typing
 */

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useReferralSearch } from '@/hooks/useReferralSearch';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SelectedReferrer {
  user_id: string;
  handle: string;
}

interface ReferralComboboxProps {
  supabase: SupabaseClient;
  currentUserId: string;
  onValidReferrer: (referrer: SelectedReferrer) => void;
  onClear?: () => void;
}

export function ReferralCombobox({
  supabase,
  currentUserId,
  onValidReferrer,
  onClear,
}: ReferralComboboxProps) {
  const { query, setQuery, items, loading, error, parseHandle } = useReferralSearch(supabase, 500);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selected, setSelected] = useState<SelectedReferrer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus stable on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset highlight when items change
  useEffect(() => {
    setHighlight(0);
  }, [items]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
      setOpen(true);
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(items.length - 1, 0)));
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
    
    if (e.key === 'Enter' && open && items[highlight]) {
      e.preventDefault();
      choose(items[highlight]);
    }
    
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const choose = (item: typeof items[0]) => {
    // Silent self-referral block
    if (item.user_id === currentUserId) {
      return;
    }

    const referrer = {
      user_id: item.user_id,
      handle: item.handle,
    };

    setSelected(referrer);
    setOpen(false);
    onValidReferrer(referrer);
  };

  const clear = () => {
    setSelected(null);
    setQuery('');
    setOpen(false);
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className="relative" aria-expanded={open} aria-haspopup="listbox">
      <label htmlFor="referral-input" className="block text-sm font-medium mb-1">
        Who invited you?
      </label>

      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <span className="text-muted-foreground">@</span>
        <input
          id="referral-input"
          ref={inputRef}
          value={selected ? selected.handle : query}
          onChange={(e) => {
            setSelected(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="username or paste referral link"
          className="flex-1 outline-none bg-transparent text-sm"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="ref-list"
          aria-activedescendant={open ? `ref-item-${highlight}` : undefined}
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {(query || selected) && !loading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (query || loading) && (
        <ul
          id="ref-list"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-72 overflow-auto"
          onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
        >
          {items.length === 0 && !loading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No match found. Try a different username.
            </li>
          ) : (
            items.map((item, idx) => (
              <li
                key={item.user_id}
                id={`ref-item-${idx}`}
                role="option"
                aria-selected={highlight === idx}
                className={`px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  highlight === idx ? 'bg-accent text-accent-foreground' : ''
                }`}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => choose(item)}
              >
                <img
                  src={item.avatar_url || '/placeholder.svg'}
                  className="h-8 w-8 rounded-full object-cover"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">@{item.handle}</div>
                  {item.display_name && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.display_name}
                    </div>
                  )}
                </div>
                {selected?.user_id === item.user_id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </li>
            ))
          )}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
