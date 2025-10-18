/**
 * Entity Edges DB Adapter
 * Wired to Supabase RPCs for relationship management
 */

import { supabase } from '@/integrations/supabase/client';
import { EntityEdgesPort, EntityEdge, EdgeType } from '@/ports/entityEdges';

export const entityEdgesDb: EntityEdgesPort = {
  async list(entityId: string, direction: 'from' | 'to' | 'both' = 'from'): Promise<EntityEdge[]> {
    const { data, error } = await supabase.rpc('entity_edges_list' as any, {
      p_entity_id: entityId,
      p_direction: direction,
    });
    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      id: row.id,
      from_entity_id: row.from_entity_id,
      to_entity_id: row.to_entity_id,
      edge_type: row.edge_type as EdgeType,
      metadata: row.metadata || {},
      created_at: row.created_at,
    }));
  },

  async create(fromEntityId: string, toEntityId: string, edgeType: EdgeType, metadata?: Record<string, any>): Promise<string> {
    const { data, error } = await supabase.rpc('entity_edge_create' as any, {
      p_from_entity_id: fromEntityId,
      p_to_entity_id: toEntityId,
      p_edge_type: edgeType,
      p_metadata: metadata || null,
    });
    if (error) throw error;
    return data as string;
  },

  async update(edgeId: string, edgeType?: EdgeType, metadata?: Record<string, any>): Promise<void> {
    const { error } = await supabase.rpc('entity_edge_update' as any, {
      p_id: edgeId,
      p_edge_type: edgeType || null,
      p_metadata: metadata || null,
    });
    if (error) throw error;
  },

  async remove(edgeId: string): Promise<void> {
    const { error } = await supabase.rpc('entity_edge_remove' as any, {
      p_id: edgeId,
    });
    if (error) throw error;
  },

  async setPermissions(entityId: string, userId: string, canPost: boolean, canManage: boolean): Promise<string> {
    const { data, error } = await supabase.rpc('entity_edge_permissions_set' as any, {
      p_entity_id: entityId,
      p_user_id: userId,
      p_can_post: canPost,
      p_can_manage: canManage,
    });
    if (error) throw error;
    return data as string;
  },
};
