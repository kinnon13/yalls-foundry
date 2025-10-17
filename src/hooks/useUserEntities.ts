/**
 * Hook to fetch user's owned entities and determine dashboard visibility
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EntityType = 'horse' | 'farm' | 'business' | 'person';

export interface UserEntity {
  id: string;
  entity_type: EntityType;
  name: string;
  is_claimed: boolean;
  owner_id: string | null;
}

export interface EntityCapabilities {
  hasFarm: boolean;
  hasHorse: boolean;
  hasBusiness: boolean;
  hasProducers: boolean;
  entities: UserEntity[];
}

export function useUserEntities() {
  const { data: capabilities, isLoading } = useQuery<EntityCapabilities>({
    queryKey: ['user-entities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          hasFarm: false,
          hasHorse: false,
          hasBusiness: false,
          hasProducers: false,
          entities: [],
        };
      }

      // Query entity_profiles for user's owned entities
      const { data: entities, error } = await supabase
        .from('entity_profiles')
        .select('id, entity_type, name, is_claimed, owner_id')
        .eq('owner_id', user.id)
        .eq('is_claimed', true);

      if (error) {
        console.error('Error fetching user entities:', error);
        return {
          hasFarm: false,
          hasHorse: false,
          hasBusiness: false,
          hasProducers: false,
          entities: [],
        };
      }

      const userEntities = (entities || []) as UserEntity[];

      return {
        hasFarm: userEntities.some(e => e.entity_type === 'farm'),
        hasHorse: userEntities.some(e => e.entity_type === 'horse'),
        hasBusiness: userEntities.some(e => e.entity_type === 'business'),
        hasProducers: userEntities.some(e => e.entity_type === 'person'),
        entities: userEntities,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    capabilities: capabilities || {
      hasFarm: false,
      hasHorse: false,
      hasBusiness: false,
      hasProducers: false,
      entities: [],
    },
    isLoading,
  };
}
