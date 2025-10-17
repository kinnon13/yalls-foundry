import { EntityEdgesPort, EntityEdge, EdgeType } from '@/ports/entityEdges';

export const entityEdgesDb: EntityEdgesPort = {
  async list(entity_id) {
    // TODO: Wire to entity_edges table when ready
    return [];
  },

  async create(from_entity_id, to_entity_id, edge_type, options = {}) {
    // TODO: Wire entity edges creation
    return {
      id: crypto.randomUUID(),
      from_entity_id,
      to_entity_id,
      edge_type,
      allow_crosspost: options.allow_crosspost ?? true,
      auto_propagate: options.auto_propagate ?? false,
      created_at: new Date().toISOString(),
    };
  },

  async update(edge_id, options) {
    // TODO: Wire entity edges update
  },

  async remove(edge_id) {
    // TODO: Wire entity edges removal
  },
};
