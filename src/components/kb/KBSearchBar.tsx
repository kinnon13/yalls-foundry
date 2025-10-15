import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface KBSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  filters: {
    category: string;
    subcategory: string;
    tags: string[];
  };
  onFiltersChange: (filters: any) => void;
}

export function KBSearchBar({ value, onChange, filters, onFiltersChange }: KBSearchBarProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [tagInput, setTagInput] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, onChange]);

  const addTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      onFiltersChange({
        ...filters,
        tags: [...filters.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter(t => t !== tag)
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      subcategory: '',
      tags: []
    });
    setSearchValue('');
  };

  const hasActiveFilters = filters.category || filters.subcategory || filters.tags.length > 0 || searchValue;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge by title, content, or URI..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchValue('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Add Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Enter tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {(filters.tags.length > 0 || filters.category) && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {filters.category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, category: '', subcategory: '' })}
              />
            </Badge>
          )}
          {filters.subcategory && (
            <Badge variant="secondary" className="gap-1">
              Subcat: {filters.subcategory}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, subcategory: '' })}
              />
            </Badge>
          )}
          {filters.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
