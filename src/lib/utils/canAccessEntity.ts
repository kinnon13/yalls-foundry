import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a user can access/manage an entity
 * Returns true if user is the owner
 */
export async function canAccessEntity(
  entityId: string, 
  userId: string
): Promise<boolean> {
  if (!entityId || !userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('owner_user_id')
      .eq('id', entityId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking entity access:', error);
      return false;
    }
    
    return data?.owner_user_id === userId;
  } catch (err) {
    console.error('Exception in canAccessEntity:', err);
    return false;
  }
}

/**
 * Check if user owns at least one entity of a specific kind
 */
export async function hasEntityOfKind(
  userId: string,
  kind: 'business' | 'event' | 'horse' | 'person' | string
): Promise<boolean> {
  if (!userId || !kind) return false;
  
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('id')
      .eq('owner_user_id', userId)
      .eq('kind', kind as any)
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking entity kind:', error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error('Exception in hasEntityOfKind:', err);
    return false;
  }
}
