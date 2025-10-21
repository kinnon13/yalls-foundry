import { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Category {
  key: string;
  label: string;
}

interface CategoryComboboxProps {
  value: string[];
  onChange: (categories: string[]) => void;
  placeholder?: string;
}

export function CategoryCombobox({ value, onChange, placeholder = 'Search categories...' }: CategoryComboboxProps) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Category[]>([]);
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
        const { data, error } = await supabase.rpc('search_categories', {
          p_query: query.trim(),
          p_limit: 10
        });

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

  const addCategory = (cat: Category) => {
    if (!value.includes(cat.key)) {
      onChange([...value, cat.key]);
    }
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeCategory = (key: string) => {
    onChange(value.filter(k => k !== key));
  };

  const createNew = async () => {
    const key = query.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      const { error } = await supabase
        .from('biz_categories')
        .insert({ key, label: query.trim() });
      
      if (error) throw error;
      addCategory({ key, label: query.trim() });
    } catch (err) {
      console.error('Failed to create category:', err);
    }
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

  // Get labels for selected categories
  const [selectedLabels, setSelectedLabels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (value.length === 0) return;
    
    supabase
      .from('biz_categories')
      .select('key, label')
      .in('key', value)
      .then(({ data }) => {
        if (data) {
          const map = new Map(data.map(d => [d.key, d.label]));
          setSelectedLabels(map);
        }
      });
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(key => (
          <Badge key={key} variant="secondary" className="gap-1">
            {selectedLabels.get(key) || key}
            <button
              type="button"
              onClick={() => removeCategory(key)}
              className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

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
                <span>Create "{query}"</span>
              </button>
            ) : (
              items.map((cat, idx) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm ${
                    highlight === idx ? 'bg-accent' : ''
                  } ${value.includes(cat.key) ? 'opacity-50' : ''}`}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => addCategory(cat)}
                  disabled={value.includes(cat.key)}
                >
                  {cat.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
