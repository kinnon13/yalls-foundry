export type EdgeType = 'parent' | 'child' | 'member' | 'partner' | 'sponsor' | 'affiliate';

export interface EntityEdge {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  edge_type: EdgeType;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EntityEdgesPort {
  list(entityId: string, direction?: 'from' | 'to' | 'both'): Promise<EntityEdge[]>;
  create(fromEntityId: string, toEntityId: string, edgeType: EdgeType, metadata?: Record<string, any>): Promise<string>;
  update(edgeId: string, edgeType?: EdgeType, metadata?: Record<string, any>): Promise<void>;
  remove(edgeId: string): Promise<void>;
  setPermissions(entityId: string, userId: string, canPost: boolean, canManage: boolean): Promise<string>;
}
