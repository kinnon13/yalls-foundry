import { EntityEdge, EntityEdgesPort, EdgeType } from '@/ports/entityEdges';

const KEY = 'mock:entity_edges';

function read(): Record<string, EntityEdge[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(db: Record<string, EntityEdge[]>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const entityEdgesMock: EntityEdgesPort = {
  async list(entityId, direction = 'from') {
    const db = read();
    return db[entityId] || [];
  },

  async create(fromEntityId, toEntityId, edgeType, metadata = {}) {
    const db = read();
    const edges = db[fromEntityId] || [];
    
    const id = crypto.randomUUID();
    const newEdge: EntityEdge = {
      id,
      from_entity_id: fromEntityId,
      to_entity_id: toEntityId,
      edge_type: edgeType,
      metadata,
      created_at: new Date().toISOString(),
    };
    
    db[fromEntityId] = [...edges, newEdge];
    write(db);
    
    return id;
  },

  async update(edgeId, edgeType, metadata) {
    const db = read();
    for (const entityId in db) {
      const edge = db[entityId].find(e => e.id === edgeId);
      if (edge) {
        if (edgeType) edge.edge_type = edgeType;
        if (metadata) edge.metadata = { ...edge.metadata, ...metadata };
        write(db);
        return;
      }
    }
  },

  async remove(edgeId) {
    const db = read();
    for (const entityId in db) {
      db[entityId] = db[entityId].filter(e => e.id !== edgeId);
    }
    write(db);
  },

  async setPermissions(entityId, userId, canPost, canManage) {
    // Mock: just return a fake ID
    return crypto.randomUUID();
  },
};
