/**
 * Personalized Feed Component
 * 
 * Displays AI-ranked content based on user interests
 */

import { useEffect, useState } from 'react';
import { usePersonalization } from '@/hooks/usePersonalization';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PersonalizedFeedProps {
  entityType: 'marketplace_listings' | 'events';
  limit?: number;
  children: (item: any) => React.ReactNode;
}

export function PersonalizedFeed({ entityType, limit = 20, children }: PersonalizedFeedProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getPersonalizedFeed } = usePersonalization();

  useEffect(() => {
    loadFeed();
  }, [entityType, limit]);

  const loadFeed = async () => {
    try {
      setLoading(true);

      // Get personalized rankings
      const rankings = await getPersonalizedFeed(entityType, limit);
      
      if (!rankings || (rankings as any[]).length === 0) {
        // No personalization yet - fetch generic feed
        const { data, error } = await (supabase as any)
          .from(entityType)
          .select('*')
          .eq('status', 'active')
          .limit(limit);
        
        if (error) throw error;
        setItems(data || []);
      } else {
        // Fetch items in ranked order
        const entityIds = (rankings as any[]).map((r: any) => r.entity_id);
        const { data, error } = await (supabase as any)
          .from(entityType)
          .select('*')
          .in('id', entityIds);
        
        if (error) throw error;

        // Sort by ranking
        const sortedItems = entityIds
          .map((id: string) => (data || []).find((item: any) => item.id === id))
          .filter(Boolean);
        
        setItems(sortedItems);
      }
    } catch (error) {
      console.error('Error loading personalized feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <div key={item.id}>
          {children(item)}
        </div>
      ))}
    </div>
  );
}
