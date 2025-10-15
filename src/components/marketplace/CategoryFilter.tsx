/**
 * Dynamic Category Filter
 * 
 * Displays hierarchical categories loaded from dynamic_categories table
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  is_ai_suggested: boolean;
  usage_count: number;
}

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categorySlug: string | null) => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('dynamic_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories((data || []) as Category[]);

      // Auto-expand parent categories
      const parents = (data || [])
        .filter((c: Category) => c.parent_category_id === null)
        .map((c: Category) => c.id);
      setExpandedParents(new Set(parents));
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = categories.filter(c => c.parent_category_id === null);

  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parent_category_id === parentId);
  };

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading categories...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Categories</h3>
        {selectedCategory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCategoryChange(null)}
          >
            Clear
          </Button>
        )}
      </div>

      {parentCategories.map(parent => {
        const subcategories = getSubcategories(parent.id);
        const isExpanded = expandedParents.has(parent.id);

        return (
          <Collapsible
            key={parent.id}
            open={isExpanded}
            onOpenChange={() => toggleParent(parent.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 font-semibold"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {parent.name}
                {parent.is_ai_suggested && (
                  <span className="text-xs text-primary">✨ AI</span>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 space-y-1">
              {subcategories.map(sub => (
                <Button
                  key={sub.id}
                  variant={selectedCategory === sub.slug ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-sm"
                  onClick={() => onCategoryChange(sub.slug)}
                >
                  {sub.name}
                  {sub.is_ai_suggested && (
                    <span className="ml-2 text-xs text-primary">✨</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {sub.usage_count > 0 && `(${sub.usage_count})`}
                  </span>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
