/**
 * Profile Link Bars - Owned + Favorited (<200 LOC)
 * Collapsible when > 8 items
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProfileLinkBars({ userId }: { userId: string }) {
  const [ownedExpanded, setOwnedExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);

  const { data: ownedEntities = [] } = useQuery({
    queryKey: ['owned-entities', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('id, display_name, handle, kind')
        .eq('owner_user_id', userId)
        .order('display_name');

      if (error) throw error;
      return data;
    }
  });

  const { data: favoriteEntities = [] } = useQuery({
    queryKey: ['favorite-entities', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorite_entities')
        .select('entity_id, entities(id, display_name, handle, kind)')
        .eq('user_id', userId);

      if (error) throw error;
      return data.map((f: any) => f.entities);
    }
  });

  const renderBar = (
    title: string,
    items: any[],
    expanded: boolean,
    setExpanded: (v: boolean) => void
  ) => {
    if (items.length === 0) return null;

    const displayItems = expanded ? items : items.slice(0, 8);
    const hasMore = items.length > 8;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show All ({items.length})
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {displayItems.map((entity) => (
            <Link
              key={entity.id}
              to={`/entities/${entity.id}`}
              className="px-3 py-1.5 bg-card border rounded-lg hover:bg-accent transition-colors text-sm"
            >
              {entity.display_name}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderBar('Owned Pages', ownedEntities, ownedExpanded, setOwnedExpanded)}
      {renderBar('Favorited Pages', favoriteEntities, favoritesExpanded, setFavoritesExpanded)}
    </div>
  );
}
