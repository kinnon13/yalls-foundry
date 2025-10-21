import { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface MarketplaceCategory {
  key: string;
  label: string;
  status: 'active' | 'pending' | 'deprecated';
}

interface CategorySuggestion {
  label: string;
  parent_key: string | null;
  synonyms: string[];
}

interface MarketplaceCategoryComboboxProps {
  value: MarketplaceCategory[];
  onChange: (categories: MarketplaceCategory[]) => void;
  suggestions?: CategorySuggestion[];
  placeholder?: string;
}

export function MarketplaceCategoryCombobox({ 
  value, 
  onChange, 
  suggestions = [],
  placeholder = 'Search categories...' 
}: MarketplaceCategoryComboboxProps) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('search_marketplace_categories' as any, {
          p_query: query.trim(),
          p_limit: 10
        }) as { data: MarketplaceCategory[] | null; error: any };

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error('Category search failed:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const addCategory = async (cat: MarketplaceCategory | CategorySuggestion) => {
    // Check if already added
    if (value.some(v => v.key === ('key' in cat ? cat.key : slugify(cat.label)))) {
      return;
    }

    let categoryToAdd: MarketplaceCategory;

    if ('key' in cat) {
      // Existing category
      categoryToAdd = cat;
    } else {
      // New category suggestion - ensure it exists
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/categories-ensure`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            label: cat.label,
            parent_key: cat.parent_key,
            synonyms: cat.synonyms || [],
            evidence: { source: 'onboarding' }
          })
        });

        if (!response.ok) throw new Error('Failed to create category');

        const result = await response.json();
        categoryToAdd = {
          key: result.key,
          label: cat.label,
          status: result.status
        };
      } catch (err) {
        console.error('Failed to create category:', err);
        return;
      }
    }

    onChange([...value, categoryToAdd]);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeCategory = (key: string) => {
    onChange(value.filter(v => v.key !== key));
  };

  const createNew = async () => {
    const suggestion: CategorySuggestion = {
      label: query.trim(),
      parent_key: null,
      synonyms: []
    };
    await addCategory(suggestion);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
      setOpen(true);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, items.length));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    }
    if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (highlight < items.length) {
        addCategory(items[highlight]);
      } else if (query.trim() && items.length === 0) {
        createNew();
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const slugify = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  return (
    <div className="space-y-2">
      {/* Selected Categories */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(cat => (
          <Badge 
            key={cat.key} 
            variant={cat.status === 'pending' ? 'outline' : 'secondary'}
            className="gap-1"
          >
            {cat.label}
            {cat.status === 'pending' && (
              <span className="text-xs text-muted-foreground">(pending)</span>
            )}
            <button
              type="button"
              onClick={() => removeCategory(cat.key)}
              className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => addCategory(sug)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Check className="h-3 w-3" />
              {sug.label}
              <span className="text-xs text-muted-foreground">✨</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Dropdown */}
        {open && query.trim() && (
          <div
            className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-72 overflow-auto"
            onMouseDown={e => e.preventDefault()}
          >
            {items.length === 0 && !loading ? (
              <button
                type="button"
                onClick={createNew}
                className="w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-accent cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create "{query}" (pending review)</span>
              </button>
            ) : (
              items.map((cat, idx) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                    highlight === idx ? 'bg-accent' : ''
                  } ${value.some(v => v.key === cat.key) ? 'opacity-50' : ''}`}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => addCategory(cat)}
                  disabled={value.some(v => v.key === cat.key)}
                >
                  <span>{cat.label}</span>
                  {cat.status === 'pending' && (
                    <Badge variant="outline" className="text-xs">pending</Badge>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
