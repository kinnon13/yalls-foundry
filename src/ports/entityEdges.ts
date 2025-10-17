export type EdgeType = 'owns' | 'manages' | 'parent' | 'sponsors' | 'partners';

export interface EntityEdge {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  edge_type: EdgeType;
  allow_crosspost: boolean;
  auto_propagate: boolean;
  created_at: string;
}

export interface EntityEdgesPort {
  list(entity_id: string): Promise<EntityEdge[]>;
  create(from_entity_id: string, to_entity_id: string, edge_type: EdgeType, options?: { allow_crosspost?: boolean; auto_propagate?: boolean }): Promise<EntityEdge>;
  update(edge_id: string, options: { allow_crosspost?: boolean; auto_propagate?: boolean }): Promise<void>;
  remove(edge_id: string): Promise<void>;
}
